import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/socketProvider";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Select } from "antd";
import postUrl2Pro from "../../utility/postUrl2Pro";
import { postUrl } from "../../utility";
import { useNavigate } from "react-router-dom";

dayjs.extend(utc);
dayjs.extend(timezone);

const DisplayTime = () => {
    const [time, setTime] = useState(new Date);
    const [isVibrating, setIsVibrating] = useState(false);
    const [withdrawalCount, setWithdrawalCount] = useState(0);
    const { logout, sitemode, setSiteMode, setSiteCurrency, siteCurrency, fiat } = useAuth();
    const { socketAdmin } = useSocket();
    const audioRef = useRef(null);
    const navigate = useNavigate();
    const getServerTime = () => {
        postUrl2Pro(
            "/api/time",
            {},
            (data) => {
                let date = dayjs.utc(data)
                setTime(date);
            },
            logout,
        );
    }
    useEffect(() => {
        getServerTime()
        const timer = setInterval(() => {
            setTime(prev => dayjs.utc(prev).add(1, 'second'))
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch withdrawal count
    const fetchWithdrawalCount = () => {
        // Determine which endpoint to use based on site mode
        let endpoint = '';
        if (sitemode === 'mx') {
            endpoint = '/api/toppay/getWithdrawalsListCount';
        } else if (sitemode === 'ghs') {
            endpoint = '/api/wepay/getWithdrawalsListCount';
        } else if (sitemode === 'taka') {
            endpoint = '/api/worldpay/getWithdrawalsListCount';
        } else if (sitemode === 'brazil') {
            endpoint = '/api/winpay/getWithdrawalsListCount';
        }

        
        if (endpoint) {
            postUrl(
                sitemode,
                endpoint,
                { filters: { status: ['InProgress'] } },
                (count) => {
                    setWithdrawalCount(parseInt(count) || 0);
                },
                logout,
            );
        }
    };

    useEffect(() => {
        fetchWithdrawalCount();
        // Refresh count every 30 seconds
        const interval = setInterval(fetchWithdrawalCount, 30000);
        return () => clearInterval(interval);
    }, [sitemode]);

    // Handle withdrawal notifications
    useEffect(() => {
        if (!socketAdmin) return;

        const handleWithdrawalRequest = (data) => {
            // Increment withdrawal count
            setWithdrawalCount(prev => prev + 1);
            
            // Vibrate the bell
            if (navigator.vibrate) {
                // Vibrate pattern: vibrate for 200ms, pause 100ms, vibrate 200ms
                navigator.vibrate([200, 100, 200]);
                setIsVibrating(true);
                setTimeout(() => setIsVibrating(false), 10000);
            }

            // Play sound
            if (audioRef.current) {
                audioRef.current.play().catch(err => {
                    console.error("Failed to play notification sound:", err);
                });
            }
        };

        socketAdmin.on("newWithdrawalRequest", handleWithdrawalRequest);

        return () => {
            socketAdmin.off("newWithdrawalRequest", handleWithdrawalRequest);
        };
    }, [socketAdmin]);
    return (
        <>
            <div className="w-full flex justify-end sticky top-0 z-50 bg-white items-center gap-4 pt-2" >
                {process.env.REACT_APP_SITE_MODE === "betwallet" && (
                    <div className="flex items-center gap-2">
                        <Select value={siteCurrency} onChange={(value) => {
                            localStorage.setItem("nyjas-site-currency", value)
                            setSiteCurrency(value)
                            // window.location.reload()
                        }} className="w-[130px]">
                            <Select.Option value="USD">USD</Select.Option>
                            {
                                fiat.map(item => (
                                    <Select.Option value={item._id} key={item._id}>{item._id}</Select.Option>
                                ))
                            }
                        </Select>
                        <Select value={sitemode} onChange={(value) => {
                            localStorage.setItem("nyjas-site-mode", value)
                            setSiteMode(value)
                            window.location.reload()
                        }} className="w-[130px]">
                            <Select.Option value="betwallet">BetWallet</Select.Option>
                            <Select.Option value="mx">MX357</Select.Option>
                            <Select.Option value="taka">TAKA44</Select.Option>
                            <Select.Option value="ghs">GHS33</Select.Option>
                            <Select.Option value="brazil">Brazil</Select.Option>
                        </Select>
                    </div>
                )}
                <div className="text-[20px] font-bold text-cyan-500 border-2 border-cyan-500 p-1 rounded-md border-solid">
                    {(() => {
                        let formattedTime;
                        if (sitemode === "mx") {
                            formattedTime = dayjs.utc(time).tz("America/Mexico_City").format("YYYY-MM-DD HH:mm:ss");
                        } else if (sitemode === "ghs") {
                            formattedTime = dayjs.utc(time).tz("Africa/Accra").format("YYYY-MM-DD HH:mm:ss");
                        } else if (sitemode === "taka") {
                            formattedTime = dayjs.utc(time).tz("Asia/Dhaka").format("YYYY-MM-DD HH:mm:ss");
                        } else if (sitemode === "brazil") {
                            formattedTime = dayjs.utc(time).tz("America/Sao_Paulo").format("YYYY-MM-DD HH:mm:ss");
                        } else {
                            formattedTime = dayjs.utc(time).format("YYYY-MM-DD HH:mm:ss");
                        }
                        return formattedTime;
                    })()}
                </div>
                <div className="relative cursor-pointer" onClick={() => {
                    navigate('/management/withdrawal');
                }}>
                    {/* Hidden audio element for notification sound */}
                    <audio ref={audioRef} preload="auto">
                        <source src="/bell.wav" type="audio/wav" />
                    </audio>
                    <i 
                        className={`fa fa-bell text-[#ff7d00] text-2xl transition-transform duration-300 ${
                            isVibrating ? 'animate-pulse scale-110' : ''
                        }`}
                        style={{
                            animation: isVibrating ? 'shake 0.5s' : 'none',
                            animationDuration: isVibrating ? '0.5s' : 'none',
                            animationIterationCount: isVibrating ? 'infinite' : 'none',
                        }}
                    ></i>
                    {withdrawalCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center min-w-[24px] px-1 shadow-lg border-2 border-white">
                            {withdrawalCount > 99 ? '99+' : withdrawalCount}
                        </span>
                    )}
                    <style>{`
                        @keyframes shake {
                            0%, 100% { transform: translateX(0) rotate(0deg); }
                            25% { transform: translateX(-5px) rotate(-10deg); }
                            75% { transform: translateX(5px) rotate(10deg); }
                        }
                    `}</style>
                </div>
            </div>
        </>
    )
}

export default DisplayTime