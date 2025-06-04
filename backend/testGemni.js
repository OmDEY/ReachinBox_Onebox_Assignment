const categorizeEmail = require('./gemniClient');

(async () => {
  const emailText = `Hi there, I'm interested in your services. Can we schedule a call for next week?`;
  const category = await categorizeEmail(emailText);
  console.log("Categorized as:", category);
})();
