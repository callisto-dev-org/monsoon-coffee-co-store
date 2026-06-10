import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import nodemailer, { Transporter } from "nodemailer"

import { renderTemplate } from "./templates"

type InjectedDependencies = {
  logger: Logger
}

export type SmtpOptions = {
  host: string
  port: number
  secure: boolean
  user?: string
  pass?: string
  from: string
}

class SmtpNotificationService extends AbstractNotificationProviderService {
  static identifier = "notification-smtp"

  protected logger_: Logger
  protected options_: SmtpOptions
  protected transporter_: Transporter

  constructor({ logger }: InjectedDependencies, options: SmtpOptions) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.transporter_ = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: options.user
        ? { user: options.user, pass: options.pass }
        : undefined,
    })
  }

  static validateOptions(options: Record<string, unknown>): void {
    if (!options.host) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SMTP notification provider requires a `host` (set SMTP_HOST)."
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SMTP notification provider requires a `from` address (set SMTP_FROM)."
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No notification provided"
      )
    }

    const data = notification.data ?? {}
    const rendered = renderTemplate(notification.template, data)

    // Precedence: explicit content > template registry > raw data fields.
    const subject =
      notification.content?.subject ??
      rendered.subject ??
      (data.subject as string | undefined) ??
      "Notification"
    const html =
      notification.content?.html ??
      rendered.html ??
      (data.html as string | undefined)
    const text =
      notification.content?.text ??
      rendered.text ??
      (data.text as string | undefined) ??
      (html ? undefined : JSON.stringify(data, null, 2))

    try {
      const info = await this.transporter_.sendMail({
        from: notification.from?.trim() || this.options_.from,
        to: notification.to,
        subject,
        html,
        text,
        attachments: notification.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.content_type,
          encoding: "base64",
          cid: a.id ?? undefined,
        })),
      })
      return { id: info.messageId }
    } catch (e) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email via SMTP: ${(e as Error).message}`
      )
    }
  }
}

export default SmtpNotificationService
