async function handleFallback(ctx) {
  const { msg } = ctx;

  // 🔥 DO NOTHING for interactive
  if (msg.type === "interactive") {
    return true;
  }

  // menu only for text
  await sendMainMenu(ctx);
  return true;
}
