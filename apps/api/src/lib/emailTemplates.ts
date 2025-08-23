export function baseEmail({ title, content }: { title: string; content: string }) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>${title}</title></head>
  <body style="margin:0;background:#0b1220;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1220;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:92%;background:#0f1629;border-radius:14px;border:1px solid #1f2a44;color:#e5e7eb;font-family:Segoe UI,Roboto,Arial,sans-serif;">
            <tr>
              <td style="padding:18px 22px;border-bottom:1px solid #1f2a44;">
                <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:#2563eb;color:#fff;text-align:center;line-height:28px;font-weight:700;margin-right:8px;">I</span>
                <span style="font-weight:800;letter-spacing:.3px">IITK Market</span>
              </td>
            </tr>
            <tr><td style="padding:22px">${content}</td></tr>
            <tr><td style="padding:14px 22px;border-top:1px solid #1f2a44;color:#94a3b8;font-size:12px">
              You're receiving this because you're using IITK Market. Never share login codes with anyone.
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body></html>`;
}

export function otpEmail({ code }: { code: string }) {
  const content = `
    <h1 style="margin:0 0 8px 0;font-size:20px">Your login code</h1>
    <p style="margin:0 0 14px 0;color:#94a3b8">Enter this 6‑digit code to log in. It expires in 10 minutes.</p>
    <div style="display:inline-block;background:#111a2d;border:1px solid #1f2a44;border-radius:12px;padding:12px 16px;font-size:24px;letter-spacing:8px;font-weight:800;color:#ffffff">${code}</div>
    <p style="margin:16px 0 0 0;color:#94a3b8">If you didn't request this, you can ignore this email.</p>
  `;
  return {
    subject: "Your IITK Market login code",
    html: baseEmail({ title: "Login code", content }),
    text: `Your IITK Market login code: ${code}\nExpires in 10 minutes.\nIf you didn't request this, ignore the email.`
  };
}

export function postNotificationEmail({ listing, owner, webUrl }: { listing: any; owner: any; webUrl: string }) {
  const hero = listing.images?.[0] ? `<img src="${listing.images[0]}" alt="" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px;border:1px solid #1f2a44;margin:4px 0 12px 0" />` : "";
  const price = listing.type === "sale" && listing.price ? `Price: ₹${listing.price}` : "";
  const content = `
    <h1 style="margin:0 0 8px 0;font-size:20px">New ${listing.type?.toUpperCase?.()} posted</h1>
    <h2 style="margin:0 0 10px 0;font-size:18px;color:#e5e7eb">${listing.title}</h2>
    ${hero}
    <p style="margin:0 0 8px 0;color:#cbd5e1">${listing.description || ""}</p>
    ${price ? `<p style="margin:0 0 12px 0;color:#cbd5e1">${price}</p>` : ""}
    <p style="margin:0 0 12px 0;color:#94a3b8">Category: ${listing.category || "-"} • Status: ${listing.status || "active"}</p>
    <a href="${webUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700">Open IITK Market</a>
    <div style="margin-top:14px;color:#94a3b8;font-size:13px">
      Posted by ${owner?.name || owner?.email} • ${owner?.email}
    </div>
  `;
  return {
    subject: `[IITK Market] New ${listing.type?.toUpperCase?.()}: ${listing.title}`,
    html: baseEmail({ title: "New listing", content }),
    text: `New ${listing.type?.toUpperCase?.()} posted\nTitle: ${listing.title}\n${listing.description || ""}\n${price}\nOpen: ${webUrl}\nBy: ${owner?.name || owner?.email} (${owner?.email})`
  };
}