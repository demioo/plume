import nodemailer from 'nodemailer'

export async function sendEmail(to: string, html: string) {
  // let testAccount = await nodemailer.createTestAccount()
  // console.log('tesAccount', testAccount)

  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'siimisf4gjdbmrbv@ethereal.email',
      pass: '677aDaBzv2jtJG5jTX',
    },
  })

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Demi" <demi@example.com>',
    to,
    subject: 'Change password',
    html,
  })

  console.log('Message sent: %s', info.messageId)
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
}
