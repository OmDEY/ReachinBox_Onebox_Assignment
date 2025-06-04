// Configuration for multiple email accounts
const emailAccounts = [
  {
    id: 'account1',
    user: process.env.EMAIL_1_USER,
    password: process.env.EMAIL_1_PASS,
    host: process.env.EMAIL_1_HOST,
    port: parseInt(process.env.EMAIL_1_PORT),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    labels: {
      interested: 'Interested',
      meetingBooked: 'Meeting Booked',
      notInterested: 'Not Interested',
      spam: 'Spam',
      outOfOffice: 'Out of Office'
    },
    enabled: true
  },
  // Add more accounts as needed
  // {
  //   id: 'account2',
  //   user: process.env.EMAIL_2_USER,
  //   password: process.env.EMAIL_2_PASS,
  //   host: process.env.EMAIL_2_HOST,
  //   port: parseInt(process.env.EMAIL_2_PORT),
  //   tls: true,
  //   tlsOptions: { rejectUnauthorized: false },
  //   labels: {
  //     interested: 'Interested',
  //     meetingBooked: 'Meeting Booked',
  //     notInterested: 'Not Interested',
  //     spam: 'Spam',
  //     outOfOffice: 'Out of Office'
  //   },
  //   enabled: true
  // }
].filter(account => account.enabled);

module.exports = emailAccounts;
