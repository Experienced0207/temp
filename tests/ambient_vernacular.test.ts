import { describe, it, expect } from 'vitest';
import { getClinicalRedFlags } from '../packages/engine/clinicalIntake';
import { checkHerbDrugInteractions } from '../frontend/website/src/lib/herbDrugInteractions';

describe('Dynamic Emergency Red-Flag Intent Engine (Voice Kiosk / Ramesh Scenario)', () => {
  it('correctly flags Ramesh acute chest pain and cardiac symptoms as Level-1 Emergency Red-Flags', () => {
    // Spoken Hindi / Vernacular variants
    expect(getClinicalRedFlags('सीने में बहुत तेज दर्द है और सांस फूल रही है')).toContain('chest_pain');
    expect(getClinicalRedFlags('छाती में दर्द और पसीना आ रहा है')).toContain('chest_pain');
    expect(getClinicalRedFlags('seene me dard hai')).toContain('chest_pain');
    expect(getClinicalRedFlags('Severe retrosternal chest pain with left arm radiation')).toContain('chest_pain');
    expect(getClinicalRedFlags('acute shortness of breath cannot breathe')).toContain('breathlessness');
    expect(getClinicalRedFlags('अचानक चक्कर आकर बेहोश हो गए')).toContain('fainting');
  });

  it('keeps benign non-emergent complaints at routine priority without false emergency triggers', () => {
    // Non-emergent cases
    expect(getClinicalRedFlags('मुझे 6 महीने से दोनों घुटनों में दर्द है')).toEqual([]);
    expect(getClinicalRedFlags('कल रात से सिर में हल्का दर्द है')).toEqual([]);
    expect(getClinicalRedFlags('पेट में हल्की गैस और खट्टी डकारें आ रही हैं')).toEqual([]);
    expect(getClinicalRedFlags('Routine health checkup and BP review')).toEqual([]);
  });
});

describe('Dynamic Herb-Drug Interaction Sentinel', () => {
  it('detects high-severity antiplatelet contraindication when Aspirin and Guggulu are co-prescribed', () => {
    const allo = [{ drug: 'Tab Ecosprin 150mg' }];
    const ayur = [{ drug: 'Yograj Guggulu' }];
    const alerts = checkHerbDrugInteractions(allo, ayur);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]?.severity).toBe('CONTRAINDICATED');
    expect(alerts[0]?.ayurvedicHerb).toContain('Guggulu');
  });

  it('permits safe Allopathic and Ayurvedic combinations without false alarms', () => {
    const allo = [{ drug: 'Tab Dolo 650mg' }];
    const ayur = [{ drug: 'Ashwagandha Churna' }];
    const alerts = checkHerbDrugInteractions(allo, ayur);
    expect(alerts.length).toBe(0);
  });
});
