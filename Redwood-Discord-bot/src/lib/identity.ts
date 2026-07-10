/** A generated cover — the random values before they are persisted. */
export interface GeneratedIdentity {
  legalName: string;
  dob: string;        // ISO date, YYYY-MM-DD
  ssn: string;        // XXX-XX-XXXX
  idNumber: string;   // driver's-license style
  bloodType: string;
  nextOfKin: string;
}

/** A persisted cover packet. */
export interface Identity extends GeneratedIdentity {
  id: string;
  discordId: string;
  issuedAt: string;
  status: 'active' | 'retired';
  retiredAt: string | null;
}
