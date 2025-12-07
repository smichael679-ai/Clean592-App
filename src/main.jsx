import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Camera, MapPin, Send, AlertTriangle, Car, Trash2, Info, CheckCircle, Menu, X, ChevronRight, Upload, Image as ImageIcon, Download, Share2, Wifi, WifiOff, CloudUpload, Clock, Shield, Trophy, Activity } from 'lucide-react';

// --- Custom CSS for hiding scrollbars ---
const styles = `
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
body {
  margin: 0;
  padding: 0;
  background-color: #f3f4f6;
}
`;

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  // Inject global styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  
  // Offline & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingReports, setPendingReports] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userRank, setUserRank] = useState(124);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mock History
  const [submittedReports, setSubmittedReports] = useState([
    {
      id: 991,
      type: 'vehicle_dumping',
      address: 'Sheriff St & Duncan St',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'Action Taken',
      pointsAwarded: 30, // 20 submission + 10 success
      licensePlate: 'PAD 4521',
      description: 'Truck dumping construction waste.'
    },
    {
      id: 992,
      type: 'littering',
      address: 'Seawall Road',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: 'Investigation',
      pointsAwarded: 20, // 20 submission only
      description: 'Pile of plastic bottles left after event.'
    }
  ]);

  const [reportStep, setReportStep] = useState(0); 
  const [reportData, setReportData] = useState({
    id: null, image: null, imagePreview: null, location: null,
    address: '', type: 'vehicle_dumping', licensePlate: '',
    description: '', anonymous: false, timestamp: null
  });

  // --- Logic Engine ---
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncReports(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const savedPending = localStorage.getItem('epa_pending_reports');
    if (savedPending) setPendingReports(JSON.parse(savedPending));

    const savedHistory = localStorage.getItem('epa_history_reports');
    if (savedHistory) setSubmittedReports(JSON.parse(savedHistory));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const total = submittedReports.reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);
    setUserPoints(total);
    setUserRank(Math.max(1, 150 - Math.floor(total / 30))); 
  }, [submittedReports]);

  const syncReports = async () => {
    const saved = localStorage.getItem('epa_pending_reports');
    if (!saved) return;
    const reports = JSON.parse(saved);
    if (reports.length === 0) return;

    setIsSyncing(true);
    setTimeout(() => {
      const newHistory = [...reports.map(r => ({
        ...r, status: 'Received', pointsAwarded: 20, syncTime: new Date().toISOString()
      })), ...submittedReports];
      
      setSubmittedReports(newHistory);
      localStorage.setItem('epa_history_reports', JSON.stringify(newHistory));
      setPendingReports([]);
      localStorage.removeItem('epa_pending_reports');
      setIsSyncing(false);
    }, 2000); 
  };

  const submitReport = () => {
    const newReport = {
      ...reportData, id: Date.now(), timestamp: new Date().toISOString(),
      status: isOnline ? 'Received' : 'Pending Upload',
      pointsAwarded: isOnline ? 20 : 0
    };

    if (isOnline) {
      const newHistory = [newReport, ...submittedReports];
      setSubmittedReports(newHistory);
      localStorage.setItem('epa_history_reports', JSON.stringify(newHistory));
      setTimeout(() => setReportStep(5), 1500);
    } else {
      const updatedPending = [...pendingReports, newReport];
      setPendingReports(updatedPending);
      localStorage.setItem('epa_pending_reports', JSON.stringify(updatedPending));
      setReportStep(5); 
    }
  };

  const handleGetLocation = () => {
    setReportData(prev => ({
      ...prev, location: { lat: 6.8013, lng: -58.1551 },
      address: 'Camp St & Church St, Georgetown'
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportData(prev => ({ ...prev, image: file, imagePreview: reader.result }));
        handleGetLocation(); 
        setReportStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setReportData({
      id: null, image: null, imagePreview: null, location: null, address: '',
      type: 'vehicle_dumping', licensePlate: '', description: '', anonymous: false, timestamp: null
    });
    setReportStep(0);
    setActiveTab('home');
  };

  // --- Components ---
  const OfflineBanner = () => {
    if (isOnline && pendingReports.length === 0) return null;
    return (
      <div className={`px-4 py-2 text-xs font-bold flex justify-between items-center ${!isOnline ? 'bg-gray-800 text-gray-200' : 'bg-blue-600 text-white'}`}>
        {!isOnline ? <div className="flex items-center"><WifiOff size={14} className="mr-2"/> You are offline</div> : <div className="flex items-center"><Wifi size={14} className="mr-2"/> Back online</div>}
        {pendingReports.length > 0 && (
          <div className="flex items-center bg-white/20 px-2 py-1 rounded">
             {isSyncing ? <span className="animate-pulse">Syncing...</span> : <><CloudUpload size={14} className="mr-2"/> {pendingReports.length} Pending</>}
          </div>
        )}
      </div>
    );
  };

  const Header = () => (
    <div className="bg-green-700 text-white shadow-md sticky top-0 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto p-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10">
             <img src="./icon-192.png" alt="EPA" className="w-10 h-10 rounded-full border-2 border-white bg-white object-contain absolute top-0 left-0 z-10" onError={(e) => { e.target.style.opacity = 0; }} />
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-700 font-bold border-2 border-green-100 absolute top-0 left-0"><Shield size={20} className="fill-green-100" /></div>
          </div>
          <h1 className="font-bold text-lg tracking-tight">Clean592</h1>
        </div>
        <button onClick={() => setShowMenu(!showMenu)}>{showMenu ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
      <OfflineBanner />
      {showMenu && (
        <div className="absolute top-full left-0 right-0 bg-green-800 shadow-xl border-t border-green-600 animate-in slide-in-from-top-2 z-50">
          <div className="p-4 space-y-3">
             <div className="bg-green-900/50 p-3 rounded-lg border border-green-600 mb-4 flex justify-between items-center">
                <div><p className="text-xs text-green-300 uppercase font-bold mb-1">Rank</p><p className="text-xl font-black text-white">#{userRank}</p></div>
                <div className="text-right"><p className="text-xs text-green-300 uppercase font-bold mb-1">Points</p><p className="text-xl font-black text-yellow-400">{userPoints}</p></div>
             </div>
            <button onClick={() => { setShowMenu(false); setActiveTab('history'); }} className="block w-full text-left py-2 px-3 hover:bg-green-700 rounded text-green-50 font-medium">My Report History</button>
            <div className="border-t border-green-600 my-2"></div>
            <p className="text-xs text-green-200 px-3">Hotline: 225-5467</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <Header />
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
          <div className="flex flex-col h-full bg-gray-50 pb-24">
            <div className="bg-gradient-to-b from-green-700 to-green-600 text-white p-6 rounded-b-[2.5rem] shadow-xl">
              <h2 className="text-3xl font-black mb-1 leading-tight">STOP LITTERING.</h2>
              <h3 className="text-xl font-bold text-sky-300 mb-4">KEEP IT CLEAN.</h3>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center justify-between mb-2">
                 <div><div className="flex items-center text-yellow-300 font-bold mb-1"><Trophy size={16} className="mr-1" /><span className="text-xs uppercase">Rewards</span></div><p className="text-2xl font-black">{userPoints} <span className="text-sm font-medium text-green-100">pts</span></p></div>
                 <div className="text-right"><span className="text-[10px] text-green-100 block mb-1">Rank</span><span className="bg-white text-green-800 font-bold px-3 py-1 rounded-full text-xs">#{userRank}</span></div>
              </div>
            </div>
            <div className="p-6 -mt-4">
              <button onClick={() => { setReportStep(1); setActiveTab('report'); }} className="w-full bg-sky-600 hover:bg-sky-500 active:scale-95 transition-all text-white font-black text-xl py-6 rounded-2xl shadow-xl flex items-center justify-center space-x-3 border-b-4 border-sky-800 relative z-10"><Camera size={28} /><span>REPORT VIOLATION</span></button>
              <div className="mt-8">
                 <div className="flex justify-between items-center mb-4 px-1"><h3 className="font-bold text-gray-700 text-sm uppercase">Recent Activity</h3><button onClick={() => setActiveTab('history')} className="text-green-600 text-xs font-bold">View All</button></div>
                 {submittedReports.length > 0 ? (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center space-x-3">
                       <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Activity size={20} /></div>
                       <div><h4 className="font-bold text-gray-800 text-sm">{submittedReports[0].type === 'vehicle_dumping' ? 'Vehicle Report' : 'Litter Report'}</h4><p className="text-xs text-gray-500">Status: <span className="font-medium text-green-600">{submittedReports[0].status}</span></p></div>
                    </div>
                 ) : <div className="text-center text-gray-400 p-4">No reports yet.</div>}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="flex flex-col h-full bg-gray-50 p-4 overflow-y-auto pb-24">
            <h2 className="text-xl font-bold text-gray-800 mb-6">My Reports</h2>
            <div className="space-y-4">
              {[...pendingReports.map(r => ({...r, status: 'Pending'})), ...submittedReports].map(r => (
                <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-800 text-sm capitalize">{r.type.replace('_', ' ')}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.status === 'Action Taken' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{new Date(r.timestamp).toLocaleDateString()}</p>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden flex">
                    <div className={`h-full w-1/3 bg-green-500`}></div>
                    <div className={`h-full w-1/3 ${r.status !== 'Received' && r.status !== 'Pending' ? 'bg-green-500' : ''}`}></div>
                    <div className={`h-full w-1/3 ${r.status === 'Action Taken' ? 'bg-green-500' : ''}`}></div>
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-400 mt-1 uppercase"><span>Received</span><span>Investigation</span><span>Action</span></div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveTab('home')} className="mt-8 text-center text-green-600 font-bold text-sm w-full">Back to Home</button>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="flex flex-col h-full bg-gray-50">
             {reportStep === 1 && (
               <div className="flex flex-col h-full bg-black text-white p-6 justify-center">
                 <button onClick={resetForm} className="absolute top-4 right-4"><X size={24}/></button>
                 <h2 className="text-2xl font-bold mb-8 text-center">Evidence</h2>
                 <div className="bg-gray-900 border-2 border-dashed border-gray-600 rounded-2xl p-8 flex flex-col items-center mb-4 relative">
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="absolute inset-0 opacity-0 w-full h-full"/>
                    <Camera size={48} className="text-green-500 mb-2"/>
                    <span className="font-bold">Take Photo</span>
                 </div>
                 <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 flex items-center justify-center relative">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 w-full h-full"/>
                    <ImageIcon size={20} className="mr-2"/> Upload Gallery
                 </div>
               </div>
             )}
             {reportStep === 2 && (
               <div className="p-6">
                 <h2 className="text-2xl font-bold mb-4">Location</h2>
                 <div className="bg-white p-4 rounded-xl shadow h-64 flex items-center justify-center flex-col">
                    <MapPin size={40} className="text-red-500 mb-2"/>
                    <p className="text-xs text-gray-500">Geotagged: {reportData.location?.lat}, {reportData.location?.lng}</p>
                 </div>
                 <button onClick={() => setReportStep(3)} className="w-full bg-green-800 text-white font-bold py-4 rounded-xl mt-4 shadow-md">Confirm Location</button>
               </div>
             )}
             {reportStep === 3 && (
               <div className="p-6">
                 <h2 className="text-2xl font-bold mb-4">Details</h2>
                 <textarea className="w-full p-4 border rounded-xl mb-4" rows="4" placeholder="Describe what is happening..." onChange={(e) => setReportData({...reportData, description: e.target.value})}></textarea>
                 <button onClick={() => setReportStep(4)} className="w-full bg-green-800 text-white font-bold py-4 rounded-xl shadow-md">Review</button>
               </div>
             )}
             {reportStep === 4 && (
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Confirm</h2>
                  <div className="bg-white p-4 rounded-xl shadow mb-4">
                    <p className="font-bold text-gray-800">Description:</p>
                    <p className="text-gray-600 text-sm mb-2">{reportData.description}</p>
                    <p className="font-bold text-gray-800">Location:</p>
                    <p className="text-gray-600 text-sm">{reportData.address}</p>
                  </div>
                  <button onClick={submitReport} className="w-full bg-green-700 text-white font-bold py-4 rounded-xl shadow-md flex justify-center items-center"><Send size={20} className="mr-2"/> Submit Report</button>
                </div>
             )}
             {reportStep === 5 && (
               <div className="flex flex-col h-full justify-center items-center p-8 bg-green-800 text-white text-center">
                 <CheckCircle size={64} className="mb-4"/>
                 <h2 className="text-3xl font-bold mb-2">Received!</h2>
                 <p className="mb-8">Your report is in the queue.</p>
                 <div className="bg-white/10 p-4 rounded-xl mb-8"><p className="text-2xl font-black text-yellow-400">+20 pts</p></div>
                 <button onClick={resetForm} className="bg-white text-green-900 font-bold py-3 px-8 rounded-full">Home</button>
               </div>
             )}
          </div>
        )}
      </div>
      
      {activeTab === 'home' && (
        <div className="bg-white border-t border-gray-200 p-2 flex justify-around items-center absolute bottom-0 w-full z-10 pb-6 pt-3">
          <button onClick={() => setActiveTab('home')} className="flex flex-col items-center text-green-800"><MapPin size={24} /><span className="text-[10px] font-bold">Home</span></button>
          <button onClick={() => {setReportStep(1); setActiveTab('report');}} className="flex flex-col items-center text-gray-400 -mt-8"><div className="bg-sky-500 p-4 rounded-full shadow-lg border-4 border-gray-50 text-white"><Camera size={32} /></div></button>
          <button onClick={() => setActiveTab('history')} className="flex flex-col items-center text-gray-400"><Clock size={24} /><span className="text-[10px] font-bold">History</span></button>
        </div>
      )}
    </div>
  );
};

// Render the App
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
