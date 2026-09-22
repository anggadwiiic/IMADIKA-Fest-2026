export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message } = req.body;

    if (message && message.text && message.text.startsWith("/start ")) {
      const chatId = message.chat.id;
      const userId = message.text.split(" ")[1];

      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

      const updateRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ telegram_chat_id: chatId.toString() }),
        },
      );

      let replyText =
        "Sukses! Akun FOUNDEX Anda telah terhubung. Anda akan menerima notifikasi otomatis saat ada kecocokan barang.";
      if (!updateRes.ok) {
        replyText =
          "Maaf, terjadi kesalahan saat menghubungkan akun. Pastikan Anda menekan link dari dalam web FOUNDEX.";
      }

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
        }),
      });
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).send("Internal Server Error");
  }
}
