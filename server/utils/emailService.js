import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// We are now using Brevo's HTTP API via Axios to completely bypass 
// Render's restriction on outbound SMTP ports (25, 465, 587).
// Ensure you have added BREVO_API_KEY to your .env file!

export const sendOTPEmail = async (email, otp) => {
    try {
        const data = {
            sender: {
                name: "YourTube Auth",
                email: process.env.EMAIL_USER // This email must be verified as a sender in your Brevo account
            },
            to: [
                {
                    email: email
                }
            ],
            subject: "Your OTP for YourTube Login",
            htmlContent: `
                <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #ef4444; margin: 0; font-size: 28px; font-weight: 900;">Your-Tube</h1>
                    </div>
                    <p style="color: #475569; font-size: 16px; text-align: center;">Verify your identity with the code below:</p>
                    
                    <div style="background-color: #f8fafc; border-radius: 16px; padding: 25px; text-align: center; margin: 25px 0; border: 2px dashed #e2e8f0;">
                        <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1e293b;">${otp}</span>
                    </div>

                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        This code will expire in <strong>5 minutes</strong>.<br>
                        If you didn't request this, please ignore this email.
                    </p>
                    
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;">
                    
                    <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin: 0;">
                        Secure Region-Based Authentication System
                    </p>
                </div>
            `
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            }
        });

        console.log("OTP Email sent successfully via Brevo API:", response.data);
        return response.data;
    } catch (error) {
        console.error("OTP Email Error:", error.response ? error.response.data : error.message);
    }
};

export const sendInvoiceEmail = async (user, planDetails) => {
    try {
        const { planName, amount, paymentId, recipientEmail } = planDetails;
        const toEmail = recipientEmail || user.email;

        const data = {
            sender: {
                name: "YourTube Support",
                email: process.env.EMAIL_USER // This email must be verified as a sender in your Brevo account
            },
            to: [
                {
                    email: toEmail
                }
            ],
            subject: "Subscription Upgrade Successful",
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #10b981; text-align: center;">Payment Successful! 🎉</h2>
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p style="font-size: 16px; font-weight: bold; color: #333; text-align: center;">Congratulations! You successfully done the payment.</p>
                    <p>Thank you for your purchase! Your subscription to the <strong>${planName} Plan</strong> is now active.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr style="background-color: #f8f9fa;">
                            <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
                            <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Amount</th>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${planName} Plan Access</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${amount}</td>
                        </tr>
                        <tr style="font-weight: bold;">
                            <td style="padding: 10px;">Total Paid</td>
                            <td style="padding: 10px; text-align: right;">₹${amount}</td>
                        </tr>
                    </table>

                    <div style="margin-top: 20px; padding: 15px; background-color: #f1f1f1; border-radius: 5px;">
                        <p style="margin: 0; font-size: 14px;"><strong>Payment ID:</strong> ${paymentId}</p>
                        <p style="margin: 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p style="margin: 0; font-size: 14px;"><strong>Plan Name:</strong> ${planName}</p>
                    </div>

                    <p style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
                        If you have any questions, contact our support team.
                    </p>
                </div>
            `
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            }
        });

        console.log("Invoice Email sent successfully via Brevo API:", response.data);
        return response.data;
    } catch (error) {
        console.error("Email Service Error:", error.response ? error.response.data : error.message);
    }
};