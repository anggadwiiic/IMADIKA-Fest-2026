const { createClient } = require("@supabase/supabase-js");

function getCosineSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const getTokens = (str) => str.toLowerCase().match(/\w+/g) || [];
  const tokens1 = getTokens(str1);
  const tokens2 = getTokens(str2);
  const uniqueTokens = [...new Set([...tokens1, ...tokens2])];

  const vec1 = uniqueTokens.map((t) => tokens1.filter((w) => w === t).length);
  const vec2 = uniqueTokens.map((t) => tokens2.filter((w) => w === t).length);

  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    let payload = req.body;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {}
    }

    const newReport = payload.record;
    console.log("\n=====================");
    console.log("Menerima Laporan:", newReport?.item_name);

    if (!newReport || newReport.status !== "active") {
      return res.status(200).send("Ignored");
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const oppositeType = newReport.type === "lost" ? "found" : "lost";
    const { data: candidates, error } = await supabase
      .from("reports")
      .select("*, profiles:reporter_id(telegram_chat_id)")
      .eq("type", oppositeType)
      .eq("category_id", newReport.category_id)
      .eq("status", "active");

    if (error || !candidates || candidates.length === 0) {
      console.log("Tidak ada kandidat kategori yang sama.");
      return res.status(200).send("No match");
    }

    const newReportDate = new Date(newReport.event_at);
    const newText = `${newReport.item_name} ${newReport.description_public || ""}`;

    for (const candidate of candidates) {
      const candidateDate = new Date(candidate.event_at);
      const diffTimeMs = Math.abs(newReportDate - candidateDate);
      const diffDays = Math.ceil(diffTimeMs / (1000 * 60 * 60 * 24));

      if (diffDays > 14) continue;

      const catScore = 1.0;
      const locScore =
        newReport.location_id === candidate.location_id ? 1.0 : 0.0;
      const timeScore = 1.0 - diffDays / 14;
      const candidateText = `${candidate.item_name} ${candidate.description_public || ""}`;
      const textScore = getCosineSimilarity(newText, candidateText);

      const totalScore =
        0.3 * catScore + 0.25 * locScore + 0.2 * timeScore + 0.25 * textScore;

      let supportCount = 0;
      if (locScore > 0) supportCount++;
      if (timeScore >= 0.5) supportCount++;
      if (textScore >= 0.2) supportCount++;

      console.log(`Skor Kemiripan: ${totalScore} | Support: ${supportCount}`);

      if (totalScore >= 0.6 && supportCount >= 2) {
        console.log("=> STATUS: LOLOS EVALUASI. Memproses DB...");

        const lostId = newReport.type === "lost" ? newReport.id : candidate.id;
        const foundId =
          newReport.type === "found" ? newReport.id : candidate.id;

        const reasonsJson = {
          support_count: supportCount,
          is_location_match: locScore > 0,
          is_time_close: timeScore >= 0.5,
          is_description_similar: textScore >= 0.2,
          time_diff_days: diffDays,
        };

        // 1. Simpan ke tabel matches (Menggunakan insert aman)
        // Kita ubah toFixed menjadi parseFloat agar menjadi tipe Number di DB
        const matchPayload = {
          lost_report_id: lostId,
          found_report_id: foundId,
          category_score: parseFloat(catScore),
          location_score: parseFloat(locScore),
          time_score: parseFloat(timeScore.toFixed(2)),
          description_score: parseFloat(textScore.toFixed(2)),
          total_score_internal: parseFloat(totalScore.toFixed(3)),
          reasons_json: reasonsJson,
        };

        // Cek dulu apakah data sudah pernah masuk (Mencegah Unique Constraint Error)
        const { data: existMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("lost_report_id", lostId)
          .eq("found_report_id", foundId)
          .single();

        if (!existMatch) {
          const { error: matchErr } = await supabase
            .from("matches")
            .insert([matchPayload]);
          if (matchErr)
            console.error("GAGAL SIMPAN MATCHES:", matchErr.message);
          else console.log("- Berhasil simpan ke tabel matches.");
        } else {
          const { error: updErr } = await supabase
            .from("matches")
            .update(matchPayload)
            .eq("id", existMatch.id);
          if (updErr) console.error("GAGAL UPDATE MATCHES:", updErr.message);
          else console.log("- Berhasil update tabel matches.");
        }

        const lostReporterId =
          newReport.type === "lost"
            ? newReport.reporter_id
            : candidate.reporter_id;
        const itemNameStr =
          newReport.type === "lost" ? newReport.item_name : candidate.item_name;

        // 2. Simpan Notifikasi Web
        const { error: notifErr } = await supabase
          .from("notifications")
          .insert([
            {
              user_id: lostReporterId,
              title: "Potensi Kecocokan Baru!",
              message: `Sistem menemukan barang temuan yang mirip dengan laporan kehilangan [${itemNameStr}] Anda.`,
              link_url: `detail-laporan.html?id=${lostId}`,
            },
          ]);
        if (notifErr)
          console.error("GAGAL SIMPAN NOTIFIKASI:", notifErr.message);
        else console.log("- Berhasil simpan notifikasi web.");

        // 3. Push Notif Telegram
        const { data: lostProfile } = await supabase
          .from("profiles")
          .select("telegram_chat_id")
          .eq("id", lostReporterId)
          .single();

        if (lostProfile && lostProfile.telegram_chat_id) {
          const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
          const tgMsg = `Halo! Terdapat laporan penemuan barang pada website FOUNDEX.\n\nSistem menemukan potensi kecocokan dengan tingkat kemiripan ${(totalScore * 100).toFixed(0)}% untuk laporan *${itemNameStr}* Anda.\n\nCek sekarang di:\nhttps://foundexweb.vercel.app/detail-laporan.html?id=${lostId}`;

          try {
            const tgRes = await fetch(tgUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: lostProfile.telegram_chat_id,
                text: tgMsg,
              }),
            });
            const tgData = await tgRes.json();
            if (!tgRes.ok) console.error("GAGAL KIRIM TELEGRAM:", tgData);
            else console.log("- Berhasil kirim pesan Telegram!");
          } catch (fetchErr) {
            console.error("TELEGRAM FETCH ERROR:", fetchErr);
          }
        } else {
          console.log("- Pelapor tidak memiliki telegram_chat_id.");
        }
      }
    }
    return res.status(200).send("Processed");
  } catch (error) {
    console.error("FATAL ERROR:", error);
    return res.status(500).send("Error");
  }
};
