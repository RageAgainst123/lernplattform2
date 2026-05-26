'use client';

import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { GeneratedCode } from '@/lib/db/student-code-actions';

// PDF-Dokument der Klassen-Code-Liste. Nutzt die eingebaute Helvetica
// (kein externer Font-Fetch — offline-tauglich).
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 12 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#555', marginBottom: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '1px solid #ddd',
    paddingVertical: 6,
  },
  codename: { fontFamily: 'Helvetica' },
  pin: { fontFamily: 'Helvetica-Bold', letterSpacing: 2 },
  header: { fontFamily: 'Helvetica-Bold', borderBottom: '1px solid #000' },
});

type Props = { className: string; codes: GeneratedCode[] };

export function CodeListPdf({ className, codes }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Zugangscodes — {className}</Text>
        <Text style={styles.subtitle}>
          Bitte vertraulich behandeln. Jede Schüler:in meldet sich mit Code und PIN an.
        </Text>
        <View style={[styles.row, styles.header]}>
          <Text>Code</Text>
          <Text>PIN</Text>
        </View>
        {codes.map((code) => (
          <View key={code.codename} style={styles.row}>
            <Text style={styles.codename}>{code.codename}</Text>
            <Text style={styles.pin}>{code.pin}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
