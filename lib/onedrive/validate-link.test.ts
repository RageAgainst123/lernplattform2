import { describe, expect, it } from 'vitest';
import { validateOneDriveLink } from './validate-link';

describe('validateOneDriveLink', () => {
  it('akzeptiert OneDrive-Business-Link (-my.sharepoint.com)', () => {
    const result = validateOneDriveLink(
      'https://nms-pitten-my.sharepoint.com/personal/max_nms-pitten_ac_at/Documents/EVA.docx?d=abc&csf=1'
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.host).toBe('nms-pitten-my.sharepoint.com');
    }
  });

  it('akzeptiert SharePoint-Link (.sharepoint.com)', () => {
    const result = validateOneDriveLink(
      'https://nms-pitten.sharepoint.com/sites/klasse-1a/Shared%20Documents/EVA.docx'
    );
    expect(result.ok).toBe(true);
  });

  it('akzeptiert OneDrive Personal (onedrive.live.com)', () => {
    expect(validateOneDriveLink('https://onedrive.live.com/edit.aspx?cid=abc').ok).toBe(true);
  });

  it('akzeptiert 1drv.ms Kurzlinks', () => {
    expect(validateOneDriveLink('https://1drv.ms/w/s!abc').ok).toBe(true);
  });

  it('blockt leere Strings', () => {
    expect(validateOneDriveLink('')).toEqual({ ok: false, reason: 'leer' });
    expect(validateOneDriveLink('   ')).toEqual({ ok: false, reason: 'leer' });
  });

  it('blockt http-URLs (MITM-Schutz)', () => {
    expect(validateOneDriveLink('http://nms-my.sharepoint.com/foo')).toEqual({
      ok: false,
      reason: 'kein_https',
    });
  });

  it('blockt Phishing-URLs die OneDrive-Domain in Pfad/Subdomain einbauen', () => {
    expect(validateOneDriveLink('https://sharepoint.com.boese.at/foo')).toEqual({
      ok: false,
      reason: 'fremde_domain',
    });
    expect(validateOneDriveLink('https://my-onedrive.live.com.boese.at/x')).toEqual({
      ok: false,
      reason: 'fremde_domain',
    });
    expect(validateOneDriveLink('https://boese.at/sharepoint.com')).toEqual({
      ok: false,
      reason: 'fremde_domain',
    });
  });

  it('blockt fremde Domains die nichts mit OneDrive zu tun haben', () => {
    expect(validateOneDriveLink('https://google.com/drive/foo')).toEqual({
      ok: false,
      reason: 'fremde_domain',
    });
    expect(validateOneDriveLink('https://drive.google.com/file/x')).toEqual({
      ok: false,
      reason: 'fremde_domain',
    });
  });

  it('blockt Müll-Strings die keine URLs sind', () => {
    expect(validateOneDriveLink('einfach text')).toEqual({ ok: false, reason: 'kein_url' });
    expect(validateOneDriveLink('::::')).toEqual({ ok: false, reason: 'kein_url' });
  });

  it('blockt URLs mit nicht-https-Protokoll (auch obskuren wie hxxps:)', () => {
    expect(validateOneDriveLink('hxxps://nms.sharepoint.com')).toEqual({
      ok: false,
      reason: 'kein_https',
    });
    expect(validateOneDriveLink('ftp://nms.sharepoint.com/x.docx')).toEqual({
      ok: false,
      reason: 'kein_https',
    });
  });

  it('blockt URLs > 2000 Zeichen', () => {
    const longUrl =
      'https://nms-my.sharepoint.com/personal/x/Documents/' + 'a'.repeat(2000) + '.docx';
    expect(validateOneDriveLink(longUrl)).toEqual({ ok: false, reason: 'zu_lang' });
  });

  it('trimmt whitespace', () => {
    expect(validateOneDriveLink('   https://nms-my.sharepoint.com/x.docx   ').ok).toBe(true);
  });

  it('case-insensitive bei Host', () => {
    expect(validateOneDriveLink('https://NMS-MY.SharePoint.COM/x.docx').ok).toBe(true);
  });
});
