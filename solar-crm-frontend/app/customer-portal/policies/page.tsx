'use client';

export default function CustomerPoliciesPage() {
  const printPolicy = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-emerald-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-orange-500 via-yellow-500 to-emerald-500 p-6 text-white shadow-2xl print:hidden">
          <a href="/customer-portal" className="text-sm font-black text-white/90">
            ← Back to Dashboard
          </a>

          <h1 className="mt-3 text-4xl font-black">📜 ग्राहक नीति</h1>

          <p className="mt-2 text-sm text-white/90">
            कंपनी नियम, भुगतान नियम, सब्सिडी जानकारी, प्रोजेक्ट शर्तें और ग्राहक जिम्मेदारियां।
          </p>

          <button
            type="button"
            onClick={printPolicy}
            className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-orange-600"
          >
            Download / Print PDF
          </button>
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-xl print:mt-0 print:rounded-none print:shadow-none">
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900">
              आदित्य सोलर्स ग्राहक नीति
            </h1>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              Customer Policy & Guidelines
            </p>
          </div>

          <PolicySection
            title="1. ग्राहक की जिम्मेदारियां"
            points={[
              'ग्राहक द्वारा दी गई जानकारी जैसे नाम, मोबाइल नंबर, पता, बिजली बिल, K Number आदि सही होना चाहिए।',
              'साइट विजिट, इंस्टॉलेशन, बिजली विभाग, सब्सिडी और दस्तावेज़ कार्यों में ग्राहक का सहयोग आवश्यक है।',
              'कंपनी द्वारा मांगे गए दस्तावेज समय पर उपलब्ध कराना ग्राहक की जिम्मेदारी है।',
            ]}
          />

          <PolicySection
            title="2. भुगतान नियम"
            points={[
              'ग्राहक को भुगतान केवल कंपनी द्वारा बताए गए आधिकारिक बैंक खाते, UPI या QR पर ही करना चाहिए।',
              'भुगतान करने के बाद रसीद/स्क्रीनशॉट ग्राहक पोर्टल में अपलोड करना आवश्यक है।',
              'गलत खाते में किए गए भुगतान की जिम्मेदारी कंपनी की नहीं होगी।',
              'Payment receipt verification के बाद ही भुगतान को आधिकारिक रूप से स्वीकार माना जाएगा।',
            ]}
          />

          <PolicySection
            title="3. प्रोजेक्ट कार्य और समय सीमा"
            points={[
              'प्रोजेक्ट की समय सीमा साइट की स्थिति, मौसम, सामग्री उपलब्धता, बिजली विभाग और सरकारी प्रक्रिया पर निर्भर कर सकती है।',
              'ग्राहक कार्य तारीख बदलने का अनुरोध पोर्टल से कर सकता है।',
              'तारीख परिवर्तन कंपनी की उपलब्धता और कार्य योजना के अनुसार स्वीकृत या अस्वीकृत किया जा सकता है।',
            ]}
          />

          <PolicySection
            title="4. सब्सिडी और सरकारी प्रक्रिया"
            points={[
              'सब्सिडी सरकारी नियमों और पोर्टल प्रक्रिया पर निर्भर करती है।',
              'सब्सिडी स्वीकृति, अस्वीकृति या देरी के लिए सरकारी विभाग जिम्मेदार होता है।',
              'ग्राहक को आवश्यक दस्तावेज, फोटो और बैंक जानकारी सही समय पर उपलब्ध करानी होगी।',
            ]}
          />

          <PolicySection
            title="5. शिकायत और सर्विस"
            points={[
              'ग्राहक पोर्टल से शिकायत दर्ज कर सकता है।',
              'फोटो और ऑडियो अपलोड करने से शिकायत को समझना और हल करना आसान होगा।',
              'कंपनी शिकायत की प्राथमिकता और उपलब्ध टीम के अनुसार समाधान करेगी।',
            ]}
          />

          <PolicySection
            title="6. दस्तावेज़ और डाउनलोड"
            points={[
              'ग्राहक पोर्टल में केवल वे दस्तावेज दिखेंगे जिन्हें कंपनी ने ग्राहक के लिए visible किया है।',
              'दस्तावेज़ देखने/डाउनलोड करने में समस्या होने पर ग्राहक कंपनी से संपर्क कर सकता है।',
            ]}
          />

          <PolicySection
            title="7. महत्वपूर्ण सूचना"
            points={[
              'यह नीति कंपनी द्वारा समय-समय पर अपडेट की जा सकती है।',
              'किसी भी विवाद की स्थिति में कंपनी रिकॉर्ड, भुगतान विवरण और प्रोजेक्ट दस्तावेजों को आधार माना जाएगा।',
              'ग्राहक को सलाह दी जाती है कि किसी भी भुगतान या महत्वपूर्ण निर्णय से पहले कंपनी प्रतिनिधि से पुष्टि करें।',
            ]}
          />
        </section>
      </div>
    </main>
  );
}

function PolicySection({
  title,
  points,
}: {
  title: string;
  points: string[];
}) {
  return (
    <div className="mt-6 rounded-3xl bg-gray-50 p-5 print:bg-white">
      <h2 className="text-xl font-black text-gray-900">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold leading-7 text-gray-700">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}