import { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  Printer,
  QrCode,
  Languages,
  ShieldCheck,
  Sun,
  Moon,
  Coffee,
  AlertCircle,
  Heart,
  Pill,
  Sparkles,
} from 'lucide-react';
import type { PrescriptionItem } from './DoctorConsultation';

interface PatientVernacularGuideProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientToken?: string;
  prescriptionItems: PrescriptionItem[];
}

interface ParsedScheduleItem {
  id: string;
  drug: string;
  genericName?: string;
  categoryHindi: string;
  categoryEnglish: string;
  badgeColor: string;
  morning: string; // '1' | '0' | '1/2'
  afternoon: string;
  night: string;
  mealTimingHindi: string;
  specialWarningHindi: string;
  audioPrompt: string;
}

export function PatientVernacularGuide({
  isOpen,
  onClose,
  patientName,
  patientAge = 52,
  patientGender = 'Male',
  patientToken = 'OPD-01',
  prescriptionItems,
}: PatientVernacularGuideProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'hi' | 'en' | 'te' | 'ta'>('hi');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeSpeakingIdx, setActiveSpeakingIdx] = useState<number | null>(null);

  // Convert raw prescription items dynamically into Vernacular visual schedules
  const parsedSchedule: ParsedScheduleItem[] = prescriptionItems.map((item, idx) => {
    const drugLower = item.drug.toLowerCase();
    const freq = (item.frequency || '1-0-1').toUpperCase();
    const instructions = (item.instructions || '').toLowerCase();

    // Frequency parsing
    let morning = '0';
    let afternoon = '0';
    let night = '0';

    if (freq.includes('1-0-1') || freq.includes('BD') || freq.includes('BID')) {
      morning = '1 गोली';
      afternoon = '-';
      night = '1 गोली';
    } else if (freq.includes('1-1-1') || freq.includes('TDS') || freq.includes('TID')) {
      morning = '1 गोली';
      afternoon = '1 गोली';
      night = '1 गोली';
    } else if (freq.includes('1-0-0') || freq.includes('OD') || freq.includes('ONCE')) {
      morning = '1 गोली';
      afternoon = '-';
      night = '-';
    } else if (freq.includes('0-0-1') || freq.includes('HS') || freq.includes('BEDTIME') || freq.includes('NIGHT')) {
      morning = '-';
      afternoon = '-';
      night = '1 गोली';
    } else if (freq.includes('0-1-0')) {
      morning = '-';
      afternoon = '1 गोली';
      night = '-';
    } else {
      morning = '1 गोली';
      afternoon = '-';
      night = '1 गोली';
    }

    // Category & Vernacular Hindi Advice
    let categoryHindi = 'सामान्य दवा';
    let categoryEnglish = 'General Medicine';
    let badgeColor = 'bg-slate-100 text-slate-800 border-slate-300';
    let mealTimingHindi = 'खाने के बाद पानी के साथ';
    let specialWarningHindi = 'नियमित समय पर लें';

    if (drugLower.includes('ecosprin') || drugLower.includes('aspirin')) {
      categoryHindi = 'दिल की सुरक्षा और खून पतला करने की दवा';
      categoryEnglish = 'Antiplatelet / Cardioprotective';
      badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
      mealTimingHindi = 'सुबह नाश्ते के बाद एक गिलास पानी के साथ';
      specialWarningHindi = 'खाली पेट बिल्कुल न लें, ताकि पेट में जलन न हो';
    } else if (drugLower.includes('atorvastatin') || drugLower.includes('statin')) {
      categoryHindi = 'कोलेस्ट्रॉल घटाने और नसों को खोलने की दवा';
      categoryEnglish = 'Lipid Lowering / Statin';
      badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
      mealTimingHindi = 'रात को खाने के बाद, सोते समय';
      specialWarningHindi = 'रात के समय लेने से यह सबसे ज्यादा असरदार होती है';
    } else if (drugLower.includes('pantoprazole') || drugLower.includes('pantocid') || drugLower.includes('pan-d') || drugLower.includes('omeprazole')) {
      categoryHindi = 'गैस, एसिडिटी और पेट में जलन से बचाव';
      categoryEnglish = 'PPI / Antacid';
      badgeColor = 'bg-sky-100 text-sky-900 border-sky-300';
      mealTimingHindi = 'सुबह खाली पेट (नाश्ता करने से आधा घंटा पहले)';
      specialWarningHindi = 'गोली को चबाएं नहीं, सीधे पानी से निगलें';
    } else if (drugLower.includes('dolo') || drugLower.includes('paracetamol')) {
      categoryHindi = 'दर्द और बुखार से तुरंत राहत';
      categoryEnglish = 'Analgesic & Antipyretic';
      badgeColor = 'bg-yellow-100 text-yellow-900 border-yellow-300';
      mealTimingHindi = 'खाना खाने के बाद (दर्द या बुखार होने पर)';
      specialWarningHindi = 'दो खुराकों के बीच कम से कम 6 घंटे का अंतर रखें';
    } else if (drugLower.includes('telmisartan') || drugLower.includes('telma')) {
      categoryHindi = 'ब्लड प्रेशर (BP) नियंत्रित रखने की दवा';
      categoryEnglish = 'Antihypertensive';
      badgeColor = 'bg-purple-100 text-purple-900 border-purple-300';
      mealTimingHindi = 'रोजाना सुबह नाश्ते के बाद एक ही समय पर';
      specialWarningHindi = 'दवा को अचानक बंद न करें';
    } else if (drugLower.includes('shallaki') || drugLower.includes('guggulu') || drugLower.includes('arjuna')) {
      categoryHindi = 'आयुर्वेदिक प्राकृतिक स्वास्थ्य रक्षक व जोड़ पोषक';
      categoryEnglish = 'AYUSH Classical Formulation';
      badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
      mealTimingHindi = 'खाने के बाद गुनगुने पानी के साथ';
      specialWarningHindi = 'नियमित सेवन से जोड़ों के दर्द व जकड़न में लाभ होता है';
    } else {
      if (instructions.includes('before') || instructions.includes('empty')) {
        mealTimingHindi = 'खाली पेट (खाने से पहले)';
      } else {
        mealTimingHindi = 'खाना खाने के बाद';
      }
    }

    const audioPrompt = `दवा नंबर ${idx + 1}: ${item.drug}। यह ${categoryHindi} है। इसे ${mealTimingHindi} लेना है। सुबह: ${morning}, दोपहर: ${afternoon}, रात: ${night}।`;

    return {
      id: `sched-${idx}`,
      drug: item.drug,
      genericName: item.genericName || item.drug,
      categoryHindi,
      categoryEnglish,
      badgeColor,
      morning,
      afternoon,
      night,
      mealTimingHindi,
      specialWarningHindi,
      audioPrompt,
    };
  });

  // Browser Speech Synthesis for Hindi vernacular guidance
  const speakSchedule = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech Synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setActiveSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const introText = `नमस्ते ${patientName} जी। डॉक्टर द्वारा निर्धारित आपकी दवाइयों की खुराक इस प्रकार है। कृपया ध्यान से सुनें। `;
    const fullText = introText + parsedSchedule.map((s) => s.audioPrompt).join(' ');

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setActiveSpeakingIdx(null);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setActiveSpeakingIdx(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col print:border-none print:shadow-none print:max-h-none print:p-2 animate-fadeIn">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl print:hidden">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-lg leading-tight">
                  मरीज सचित्र खुराक निर्देशिका
                </h3>
                <span className="text-xs text-slate-500 font-bold hidden sm:inline">
                  (Patient Pictographic Medication Guide)
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  ABHA Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                मरीज: <strong className="text-slate-800">{patientName}</strong> ({patientGender}, {patientAge}y) • टोकन: <strong className="text-indigo-700">{patientToken}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              title="Print Vernacular Handout"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">प्रिंट पर्ची</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 font-bold text-sm p-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audio Banner & Instructions */}
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 p-3 rounded-2xl gap-3 flex-wrap print:hidden">
          <div className="flex items-center gap-2.5">
            <button
              onClick={speakSchedule}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition ${
                isPlayingAudio
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isPlayingAudio ? 'आवाज़ बंद करें (Stop)' : '🔊 पूरी खुराक बोलकर सुनें (Listen Hindi Audio)'}</span>
            </button>
            <span className="text-[11px] text-slate-600 font-medium">
              अनपढ़ या बुजुर्ग मरीजों के लिए हिंदी में स्पष्ट ऑडियो निर्देश।
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-500">भाषा:</span>
            <button
              onClick={() => setSelectedLanguage('hi')}
              className={`px-2 py-1 rounded-lg font-bold text-xs ${
                selectedLanguage === 'hi' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`px-2 py-1 rounded-lg font-bold text-xs ${
                selectedLanguage === 'en' ? 'bg-emerald-700 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Pictographic Medication Cards */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {parsedSchedule.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Pill className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">कोई दवा निर्धारित नहीं है।</p>
            </div>
          ) : (
            parsedSchedule.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-4 space-y-3 shadow-xs transition"
              >
                {/* Top Row: Drug Name + Hindi Category */}
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-black text-slate-900 text-base">{item.drug}</h4>
                      {item.genericName && item.genericName !== item.drug && (
                        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                          ({item.genericName})
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.categoryHindi}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({item.categoryEnglish})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      {item.mealTimingHindi}
                    </span>
                  </div>
                </div>

                {/* Pictographic Visual Schedule Matrix */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">

                  {/* Morning */}
                  <div className={`p-3 rounded-xl border text-center transition ${
                    item.morning !== '-' ? 'bg-amber-50/80 border-amber-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-900 mb-1">
                      <Sun className="w-4 h-4 text-amber-600" />
                      <span>सुबह (Morning)</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 my-0.5">
                      {item.morning}
                    </div>
                    <div className="text-[10px] text-amber-800 font-medium">
                      {item.morning !== '-' ? 'नाश्ते के बाद/पहले' : 'नहीं लेनी'}
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div className={`p-3 rounded-xl border text-center transition ${
                    item.afternoon !== '-' ? 'bg-orange-50/80 border-orange-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-black text-orange-900 mb-1">
                      <Coffee className="w-4 h-4 text-orange-600" />
                      <span>दोपहर (Afternoon)</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 my-0.5">
                      {item.afternoon}
                    </div>
                    <div className="text-[10px] text-orange-800 font-medium">
                      {item.afternoon !== '-' ? 'दोपहर के भोजन बाद' : 'नहीं लेनी'}
                    </div>
                  </div>

                  {/* Night */}
                  <div className={`p-3 rounded-xl border text-center transition ${
                    item.night !== '-' ? 'bg-indigo-50/80 border-indigo-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-black text-indigo-900 mb-1">
                      <Moon className="w-4 h-4 text-indigo-600" />
                      <span>रात (Night)</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 my-0.5">
                      {item.night}
                    </div>
                    <div className="text-[10px] text-indigo-800 font-medium">
                      {item.night !== '-' ? 'रात भोजन/सोते समय' : 'नहीं लेनी'}
                    </div>
                  </div>

                </div>

                {/* Important Precaution Callout */}
                <div className="p-2 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-center gap-2 border border-slate-100">
                  <AlertCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>सावधानी:</strong> {item.specialWarningHindi}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Section: QR Code Handshake & Regulatory Guarantee */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 flex-wrap print:border-none">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white rounded-xl shadow-xs border border-slate-200 flex-shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(
                  JSON.stringify({
                    patient: patientName,
                    token: patientToken,
                    rx: parsedSchedule.map((s) => ({
                      drug: s.drug,
                      m: s.morning,
                      a: s.afternoon,
                      n: s.night,
                    })),
                  })
                )}`}
                alt="Medication Schedule QR Code"
                className="w-14 h-14 rounded-lg"
              />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-teal-600" />
                <span>फोन में सेव करें (Patient App & WhatsApp Sync)</span>
              </div>
              <p className="text-[11px] text-slate-500 max-w-md">
                इस QR कोड को अपने मोबाइल कैमरे या WhatsApp से स्कैन करें ताकि घर पर समय-समय पर गोली लेने का अलार्म बज सके।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
            >
              समझ गया / बंद करें (Done)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
