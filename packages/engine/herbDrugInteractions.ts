export interface HerbDrugInteraction {
  id: string;
  allopathicDrug: string;
  allopathicClass: string;
  ayurvedicHerb: string;
  ayurvedicClass: string;
  severity: "CONTRAINDICATED" | "HIGH_RISK" | "MODERATE_CAUTION" | "BENIGN";
  clinicalRisk: string;
  mechanism: string;
  recommendation: string;
}

export const KNOWN_HERB_DRUG_INTERACTIONS: HerbDrugInteraction[] = [
  {
    id: "HDI_001",
    allopathicDrug: "Aspirin",
    allopathicClass: "Antiplatelet / Salicylate",
    ayurvedicHerb: "Guggulu (Commiphora mukul)",
    ayurvedicClass: "Lekhana / Medohara",
    severity: "CONTRAINDICATED",
    clinicalRisk: "Synergistic platelet inhibition & risk of severe gastrointestinal or intracranial hemorrhage",
    mechanism: "Guggulsterones inhibit platelet aggregation and antagonize vitamin K clotting factors concurrently with COX-1 inhibition by Aspirin.",
    recommendation: "ABSOLUTE CONTRAINDICATION in acute coronary syndrome. Suspend Guggulu therapy during active Dual Antiplatelet Therapy (DAPT)."
  },
  {
    id: "HDI_002",
    allopathicDrug: "Clopidogrel",
    allopathicClass: "P2Y12 Platelet Inhibitor",
    ayurvedicHerb: "Guggulu (Commiphora mukul)",
    ayurvedicClass: "Lekhana / Medohara",
    severity: "CONTRAINDICATED",
    clinicalRisk: "Super-additive antiplatelet activity; elevated bleeding diathesis risk",
    mechanism: "Competitive inhibition of CYP3A4 along with potentiation of ADP-receptor blockade.",
    recommendation: "Contraindicated. Do not co-prescribe during post-PCI / acute ischemic phase."
  },
  {
    id: "HDI_003",
    allopathicDrug: "Aspirin",
    allopathicClass: "Antiplatelet / Salicylate",
    ayurvedicHerb: "Lasuna / Garlic (Allium sativum)",
    ayurvedicClass: "Deepana / Hridya",
    severity: "HIGH_RISK",
    clinicalRisk: "Prolonged bleeding time and micro-hemorrhage",
    mechanism: "Allicin compounds inhibit thromboxane synthase and arachidonate-induced aggregation.",
    recommendation: "Discontinue medicinal garlic extract at least 7 days prior to procedures or while on high-dose Aspirin."
  },
  {
    id: "HDI_004",
    allopathicDrug: "Warfarin",
    allopathicClass: "Vitamin K Antagonist Anticoagulant",
    ayurvedicHerb: "Guggulu / Triphala Guggulu",
    ayurvedicClass: "Lekhana",
    severity: "CONTRAINDICATED",
    clinicalRisk: "Uncontrolled elevation of INR (>4.5) with critical spontaneous bleeding risk",
    mechanism: "Altered hepatic clearance of S-warfarin and enhanced prothrombin time prolongation.",
    recommendation: "Contraindicated. Maintain strict INR telemetry if combined."
  },
  {
    id: "HDI_005",
    allopathicDrug: "Metformin",
    allopathicClass: "Biguanide Antidiabetic",
    ayurvedicHerb: "Karela (Momordica charantia)",
    ayurvedicClass: "Pramehahara",
    severity: "MODERATE_CAUTION",
    clinicalRisk: "Rapid-onset hypoglycemia (blood glucose < 55 mg/dL)",
    mechanism: "Charantin and vicine act as insulin-mimetic agents, amplifying AMPK activation by Metformin.",
    recommendation: "Caution: Reduce oral hypoglycemic agent dosage by 25-50% with frequent SMBG monitoring."
  },
  {
    id: "HDI_006",
    allopathicDrug: "Amlodipine",
    allopathicClass: "Dihydropyridine Calcium Channel Blocker",
    ayurvedicHerb: "Ashwagandha (Withania somnifera)",
    ayurvedicClass: "Rasayana / Balya",
    severity: "MODERATE_CAUTION",
    clinicalRisk: "Additive vasodilatory hypotension and syncope",
    mechanism: "GABA-mimetic central autonomic blunting combined with peripheral arterial vasodilation.",
    recommendation: "Monitor blood pressure; adjust antihypertensive dosing to avoid orthostatic dizziness."
  },
  {
    id: "HDI_007",
    allopathicDrug: "Levothyroxine",
    allopathicClass: "Synthetic Thyroid Hormone",
    ayurvedicHerb: "Ashwagandha (Withania somnifera)",
    ayurvedicClass: "Rasayana",
    severity: "MODERATE_CAUTION",
    clinicalRisk: "Subclinical thyrotoxicosis; palpitation, anxiety, and tachycardia",
    mechanism: "Withanolides stimulate thyroid glandular secretion of triiodothyronine (T3) and thyroxine (T4).",
    recommendation: "Regular monitoring of serum TSH every 4-6 weeks if Ashwagandha is supplemented."
  }
];

export function checkHerbDrugInteractions(
  allopathicDrugs: Array<{ name?: string; drug?: string } | string>,
  ayurvedicFormulations: Array<{ name?: string; drug?: string } | string>
): HerbDrugInteraction[] {
  const allopathicNames = allopathicDrugs.map(d => 
    typeof d === "string" ? d.toLowerCase() : (d.drug || d.name || "").toLowerCase()
  );
  const ayurvedicNames = ayurvedicFormulations.map(f => 
    typeof f === "string" ? f.toLowerCase() : (f.drug || f.name || "").toLowerCase()
  );

  const matched: HerbDrugInteraction[] = [];

  for (const interaction of KNOWN_HERB_DRUG_INTERACTIONS) {
    const alloKey = interaction.allopathicDrug.toLowerCase();
    const ayurKey = interaction.ayurvedicHerb.toLowerCase();

    const matchesAllopathy = allopathicNames.some(name => 
      name.includes(alloKey) || alloKey.includes(name) ||
      (alloKey === "aspirin" && (name.includes("ecosprin") || name.includes("disprin") || name.includes("asa"))) ||
      (alloKey === "clopidogrel" && (name.includes("plavix") || name.includes("clopilet"))) ||
      (alloKey === "metformin" && (name.includes("glycomet") || name.includes("glucophage"))) ||
      (alloKey === "amlodipine" && (name.includes("amlong") || name.includes("stamlo")))
    );

    const matchesAyurveda = ayurvedicNames.some(name =>
      name.includes("guggul") && ayurKey.includes("guggul") ||
      name.includes("ashwagandha") && ayurKey.includes("ashwagandha") ||
      name.includes("garlic") && ayurKey.includes("garlic") ||
      name.includes("lasuna") && ayurKey.includes("lasuna") ||
      name.includes("karela") && ayurKey.includes("karela")
    );

    if (matchesAllopathy && matchesAyurveda) {
      if (!matched.some(m => m.id === interaction.id)) {
        matched.push(interaction);
      }
    }
  }

  return matched;
}
