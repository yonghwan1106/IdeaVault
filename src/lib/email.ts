// Email notification service
// This is a basic implementation that can be extended with actual email providers like Resend, SendGrid, etc.

interface EmailTemplate {
  to: string
  subject: string
  text: string
  html: string
}

interface PurchaseNotificationData {
  buyerName: string
  ideaTitle: string
  amount: number
  purchaseDate: string
}

interface MessageNotificationData {
  senderName: string
  ideaTitle: string
  messagePreview: string
  conversationId: string
}

interface ReviewNotificationData {
  reviewerName: string
  ideaTitle: string
  rating: number
  reviewPreview: string
}

class EmailService {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY || ''
    this.apiUrl = process.env.EMAIL_API_URL || 'https://api.resend.com/emails'
  }

  private async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      // In development, just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:', {
          to: template.to,
          subject: template.subject,
          preview: template.text.substring(0, 100) + '...'
        })
        return true
      }

      // In production, use actual email service
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@ideavault.com',
          to: template.to,
          subject: template.subject,
          text: template.text,
          html: template.html,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  private formatPrice(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  async sendPurchaseNotificationToSeller(
    sellerEmail: string,
    data: PurchaseNotificationData
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: sellerEmail,
      subject: `🎉 새로운 아이디어 구매: ${data.ideaTitle}`,
      text: `
안녕하세요!

좋은 소식이 있습니다. 회원님의 아이디어가 구매되었습니다.

📋 구매 정보:
- 아이디어: ${data.ideaTitle}
- 구매자: ${data.buyerName}
- 구매 금액: ${this.formatPrice(data.amount)}
- 구매 일시: ${data.purchaseDate}

구매자가 곧 메시지를 보낼 수도 있으니 확인해보세요.

아이디어 볼트 팀 드림
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 새로운 아이디어 구매</h2>
          
          <p>안녕하세요!</p>
          
          <p>좋은 소식이 있습니다. 회원님의 아이디어가 구매되었습니다.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">📋 구매 정보</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>아이디어:</strong> ${data.ideaTitle}</li>
              <li><strong>구매자:</strong> ${data.buyerName}</li>
              <li><strong>구매 금액:</strong> <span style="color: #059669; font-weight: bold;">${this.formatPrice(data.amount)}</span></li>
              <li><strong>구매 일시:</strong> ${data.purchaseDate}</li>
            </ul>
          </div>
          
          <p>구매자가 곧 메시지를 보낼 수도 있으니 확인해보세요.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">아이디어 볼트 팀 드림</p>
        </div>
      `
    }

    return await this.sendEmail(template)
  }

  async sendPurchaseConfirmationToBuyer(
    buyerEmail: string,
    data: PurchaseNotificationData
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: buyerEmail,
      subject: `✅ 구매 완료: ${data.ideaTitle}`,
      text: `
안녕하세요!

아이디어 구매가 성공적으로 완료되었습니다.

📋 구매 정보:
- 아이디어: ${data.ideaTitle}
- 구매 금액: ${this.formatPrice(data.amount)}
- 구매 일시: ${data.purchaseDate}

이제 전체 콘텐츠에 접근하실 수 있으며, 판매자에게 직접 문의도 가능합니다.

아이디어 볼트 팀 드림
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">✅ 구매 완료</h2>
          
          <p>안녕하세요!</p>
          
          <p>아이디어 구매가 성공적으로 완료되었습니다.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">📋 구매 정보</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>아이디어:</strong> ${data.ideaTitle}</li>
              <li><strong>구매 금액:</strong> <span style="color: #059669; font-weight: bold;">${this.formatPrice(data.amount)}</span></li>
              <li><strong>구매 일시:</strong> ${data.purchaseDate}</li>
            </ul>
          </div>
          
          <p>이제 전체 콘텐츠에 접근하실 수 있으며, 판매자에게 직접 문의도 가능합니다.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">아이디어 볼트 팀 드림</p>
        </div>
      `
    }

    return await this.sendEmail(template)
  }

  async sendMessageNotification(
    recipientEmail: string,
    data: MessageNotificationData
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to: recipientEmail,
      subject: `💬 새로운 메시지: ${data.ideaTitle}`,
      text: `
안녕하세요!

${data.senderName}님이 메시지를 보냈습니다.

📝 메시지 미리보기:
"${data.messagePreview}"

아이디어: ${data.ideaTitle}

전체 메시지를 확인하려면 사이트에 접속해주세요.

아이디어 볼트 팀 드림
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">💬 새로운 메시지</h2>
          
          <p>안녕하세요!</p>
          
          <p><strong>${data.senderName}</strong>님이 메시지를 보냈습니다.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">📝 메시지 미리보기</h3>
            <p style="font-style: italic; color: #4b5563;">"${data.messagePreview}"</p>
            <p><strong>아이디어:</strong> ${data.ideaTitle}</p>
          </div>
          
          <p>전체 메시지를 확인하려면 사이트에 접속해주세요.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">아이디어 볼트 팀 드림</p>
        </div>
      `
    }

    return await this.sendEmail(template)
  }

  async sendReviewNotification(
    sellerEmail: string,
    data: ReviewNotificationData
  ): Promise<boolean> {
    const starRating = '⭐'.repeat(data.rating)
    
    const template: EmailTemplate = {
      to: sellerEmail,
      subject: `⭐ 새로운 리뷰: ${data.ideaTitle}`,
      text: `
안녕하세요!

회원님의 아이디어에 새로운 리뷰가 작성되었습니다.

⭐ 평점: ${starRating} (${data.rating}/5)
📝 리뷰어: ${data.reviewerName}
📋 아이디어: ${data.ideaTitle}

리뷰 내용 미리보기:
"${data.reviewPreview}"

전체 리뷰를 확인하려면 사이트에 접속해주세요.

아이디어 볼트 팀 드림
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">⭐ 새로운 리뷰</h2>
          
          <p>안녕하세요!</p>
          
          <p>회원님의 아이디어에 새로운 리뷰가 작성되었습니다.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">📋 리뷰 정보</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>평점:</strong> <span style="color: #f59e0b; font-size: 18px;">${starRating}</span> (${data.rating}/5)</li>
              <li><strong>리뷰어:</strong> ${data.reviewerName}</li>
              <li><strong>아이디어:</strong> ${data.ideaTitle}</li>
            </ul>
            <div style="margin-top: 15px;">
              <strong>리뷰 내용 미리보기:</strong>
              <p style="font-style: italic; color: #4b5563; margin-top: 5px;">"${data.reviewPreview}"</p>
            </div>
          </div>
          
          <p>전체 리뷰를 확인하려면 사이트에 접속해주세요.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">아이디어 볼트 팀 드림</p>
        </div>
      `
    }

    return await this.sendEmail(template)
  }
}

export const emailService = new EmailService()