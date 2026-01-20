import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LessonForm from './components/LessonForm';
import ContentInput from './components/ContentInput';
import ResultDisplay from './components/ResultDisplay';
import { Subject, OriginalDocxFile } from './types';
import { generateNLSLessonPlan } from './services/geminiService';
import { Sparkles, Settings2, Key } from 'lucide-react';
import ApiKeyModal from './components/ApiKeyModal';

const App: React.FC = () => {
  // State for Form
  const [subject, setSubject] = useState<Subject>(Subject.TOAN);
  const [grade, setGrade] = useState<number>(7);

  // Content States
  const [lessonContent, setLessonContent] = useState<string>('');
  const [distributionContent, setDistributionContent] = useState<string>('');

  // State for Options
  const [analyzeOnly, setAnalyzeOnly] = useState(false);
  const [detailedReport, setDetailedReport] = useState(false);

  // App State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);

  // State lưu trữ file DOCX gốc cho XML Injection
  const [originalDocx, setOriginalDocx] = useState<OriginalDocxFile | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    localStorage.setItem('GEMINI_API_KEY', key);
    setApiKey(key);
    setShowApiKeyModal(false);
  };

  const handleProcess = async () => {
    if (!lessonContent || lessonContent.trim().length === 0) {
      setError("Vui lòng tải lên file giáo án (Giáo án trống hoặc chưa được tải).");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Pass both contents to service
      const generatedText = await generateNLSLessonPlan(
        {
          subject,
          grade,
          content: lessonContent,
          distributionContent: distributionContent
        },
        { analyzeOnly, detailedReport, comparisonExport: false, apiKey }
      );

      if (!generatedText || generatedText.trim().length === 0) {
        throw new Error("AI trả về kết quả rỗng. Vui lòng thử lại với file giáo án rõ ràng hơn.");
      }

      setResult(generatedText);
    } catch (err: any) {
      console.error("Process Error:", err);
      setError(err.message || "Đã xảy ra lỗi không xác định khi kết nối với AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 font-sans pb-12">
      <Header onOpenSettings={() => setShowApiKeyModal(true)} />

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            <LessonForm
              subject={subject} setSubject={setSubject}
              grade={grade} setGrade={setGrade}
            />

            <ContentInput
              lessonContent={lessonContent}
              setLessonContent={setLessonContent}
              distributionContent={distributionContent}
              setDistributionContent={setDistributionContent}
              onOriginalDocxLoaded={setOriginalDocx}
            />

            {/* Options Panel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
              <div className="flex items-center mb-4">
                <Settings2 className="text-emerald-600 mr-2" size={20} />
                <h3 className="font-semibold text-emerald-800">Tùy chọn nâng cao</h3>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyzeOnly}
                    onChange={(e) => setAnalyzeOnly(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Chỉ phân tích, không chỉnh sửa</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={detailedReport}
                    onChange={(e) => setDetailedReport(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Kèm báo cáo chi tiết</span>
                </label>
              </div>
            </div>

            {/* API Key Config Button */}
            <div className="flex justify-end items-center space-x-3">
              {!apiKey && (
                <span className="text-sm text-orange-600 font-medium animate-pulse">
                  ⚠️ Vui lòng lấy API KEY trước khi sử dụng app
                </span>
              )}
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center space-x-1"
              >
                <Key size={16} />
                <span>Cấu hình API Key</span>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <span className="font-medium mr-2">Lỗi:</span> {error}
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={loading}
              className={`w-full py-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-white font-bold text-lg transition-all transform hover:-translate-y-1 hover:scale-[1.02] ${loading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:shadow-emerald-500/40'
                }`}
            >
              {loading ? (
                <span>Đang xử lý...</span>
              ) : (
                <>
                  <Sparkles size={24} />
                  <span>BẮT ĐẦU SOẠN GIÁO ÁN</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Info */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-lg mb-4">Hướng dẫn nhanh</h3>
              <ul className="space-y-3 text-emerald-100 text-sm">
                <li className="flex items-start">
                  <span className="bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5 font-bold">1</span>
                  Chọn môn học và khối lớp.
                </li>
                <li className="flex items-start">
                  <span className="bg-emerald-500 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5 font-bold">2</span>
                  <b>Bắt buộc:</b> Tải lên file giáo án (.docx hoặc .pdf).
                </li>
                <li className="flex items-start">
                  <span className="bg-teal-500/70 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5 font-bold">3</span>
                  <i>Tùy chọn:</i> Tải file PPCT nếu muốn AI tham khảo năng lực cụ thể của trường.
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-200">
              <h3 className="font-bold text-emerald-800 mb-3">Miền năng lực số</h3>
              <div className="space-y-2">
                {[
                  "Khai thác dữ liệu và thông tin",
                  "Giao tiếp và Hợp tác",
                  "Sáng tạo nội dung số",
                  "An toàn số",
                  "Giải quyết vấn đề",
                  "Ứng dụng AI"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center text-sm text-slate-600">
                    <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mr-2"></div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="mt-8">
          <ResultDisplay result={result} loading={loading} originalDocx={originalDocx} />
        </div>
      </main>

      <footer className="mt-12 text-center text-emerald-800/70 text-sm py-6 bg-gradient-to-t from-emerald-50 to-transparent">
        <p>© 2024 NLS Assistant. Built with Gemini API & React.</p>
        <p className="mt-2 font-bold text-emerald-700">
          Tác giả: Thầy Đinh Thành - ĐT 0915.213717
        </p>
        <p className="mt-2 text-emerald-600 font-medium">
          Liên hệ Zalo Đinh Thành 0915.213717
        </p>
      </footer>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onSave={handleSaveApiKey}
        onClose={() => setShowApiKeyModal(false)}
        initialKey={apiKey}
      />
    </div>
  );
};

export default App;
