import { useState, useEffect, useRef } from "react";

import { useSearchParams, useNavigate } from "react-router";
import { Layout } from "@/components/layout/Layout";
import { ThumbsUp, ThumbsDown, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { scanService } from "@/services/scan.service";



export function Feedback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scanId = searchParams.get("scanId");

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);
   const errorRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!scanId) {
      setError("No Scan ID provided. Please navigate from a diagnostic result.");
    }
  }, [scanId]);


   useEffect(() => {
     if (error && errorRef.current) {
       errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
     }
   }, [error]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCorrect === null || !scanId) return;

    setLoading(true);
    setError("");

    try {
      await scanService.submitFeedback(Number(scanId), isCorrect, note);
      setSubmitted(true);
    } catch (err: any) {

      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-20 text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto border border-green-200">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Thank you for your feedback!</h2>
          <p className="text-slate-500 text-lg">
            Your verification helps us improve the AI diagnostic model's accuracy.
          </p>
          <div className="flex justify-center items-center">
            <div className="flex gap-6">
              <button
                onClick={() => navigate("/dashboard")}
                className="cursor-pointer px-8 py-3 bg-[#2a64ad] text-white rounded-xl font-bold hover:bg-[#1e4e8c] transition-all shadow-md"
              >
                Return to Dashboard
              </button>

              <button
                onClick={() => navigate("/diary")}
                className="cursor-pointer px-8 py-3 bg-[#2a64ad] text-white rounded-xl font-bold hover:bg-[#1e4e8c] transition-all shadow-md"
              >
                Track to Diary
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-slate-800">Diagnostic Verification</h2>
          <p className="text-slate-500">Provide feedback on the AI result to help us enhance the system.</p>
        </div>

         <div ref={errorRef}>
           {error && (
             <div className="p-6 bg-red-50 border border-red-100 text-red-600 rounded-3xl space-y-4 animate-in slide-in-from-top-2 shadow-sm">
               <div className="flex items-center gap-3">
                 <AlertCircle className="w-5 h-5" />
                 <span className="text-sm font-bold">{error}</span>
               </div>
               
               {error.includes("already submitted feedback") && (
                 <div className="pt-2 border-t border-red-200/50">
                    <p className="text-xs mb-3 text-red-500 font-medium">You've already provided a clinical verification for this scan, but you can still record your daily recovery status in your diary.</p>
                    <button 
                      onClick={() => navigate("/diary")}
                      className="cursor-pointer px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md"
                    >
                      Continue to Skin Diary
                    </button>
                 </div>
               )}
             </div>
           )}
         </div>


        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-6">
              <label className="text-xl font-bold text-slate-800 block text-center">
                Was the AI diagnosis correct for your condition?
              </label>

              <div className="flex justify-center gap-8">
                <button
                  type="button"
                  onClick={() => setIsCorrect(true)}
                  className={`cursor-pointer flex flex-col items-center gap-4 p-8 rounded-3xl border-2 transition-all w-48 ${isCorrect === true
                    ? "bg-green-50 border-green-500 text-green-700 ring-4 ring-green-100"
                    : "bg-slate-50 border-slate-100 text-slate-400 hover:border-green-200 hover:bg-white"
                    }`}
                >
                  <ThumbsUp className={`w-12 h-12 ${isCorrect === true ? "fill-green-500" : ""}`} />
                  <span className="font-bold text-lg">Yes, Accurate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCorrect(false)}
                  className={`cursor-pointer flex flex-col items-center gap-4 p-8 rounded-3xl border-2 transition-all w-48 ${isCorrect === false
                    ? "bg-red-50 border-red-500 text-red-700 ring-4 ring-red-100"
                    : "bg-slate-50 border-slate-100 text-slate-400 hover:border-red-200 hover:bg-white"
                    }`}
                >
                  <ThumbsDown className={`w-12 h-12 ${isCorrect === false ? "fill-red-500" : ""}`} />
                  <span className="font-bold text-lg">No, Incorrect</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-lg font-bold text-slate-700 block">Additional Notes (Optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Please describe any discrepancies or clinical signs observed..."
                className="w-full h-40 p-6 rounded-2xl border-2 border-slate-100 focus:border-[#2a64ad] transition-all outline-none text-slate-600 resize-none bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={isCorrect === null || loading || !scanId}
              className="cursor-pointer w-full px-10 py-5 bg-[#2a64ad] text-white rounded-2xl font-bold hover:bg-[#1e4e8c] transition-all flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default Feedback;
