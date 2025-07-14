const generateRandomCode = () => {
  const prefix = "NV-";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + code;
};

module.exports = generateRandomCode;
