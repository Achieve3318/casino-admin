import { DatePicker } from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import moment from "moment";
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useAuth } from "../../context/AuthContext";
import { postUrl } from "../../utility";

dayjs.extend(customParseFormat);
const { RangePicker } = DatePicker;

const Statistic = () => {
  const { logout , sitemode, prices, siteCurrency } = useAuth();
  const [startedDate, setStartedDate] = useState(moment().startOf("month"));
  const [endDate, setEndDate] = useState(moment.now());
  const [registerData, setRegisterData] = useState([]);
  const [profitData, setProfitData] = useState([]);
  const [totalBet, setTotalBet] = useState([]);
  const [totalWin, setTotalWin] = useState([]);
  const [deposit, setDeposit] = useState([]);
  const [withDrawal, setWithDrawal] = useState([]);
  const [loginUsers, setLoginUsers] = useState([]);
  const [totalTelegramAmount, setTotalTelegramAmount] = useState([]);
  const [totalTelegramPayback, setTotalTelegramPayback] = useState([]);
  const [totalTelegramProfit, setTotalTelegramProfit] = useState([]);
  const [depositSum, setDepositSum] = useState(0);
  const [withDrawalSum, setWithDrawalSum] = useState(0);
  const [registerSum, setRegisterSum] = useState(0);
  const [series, setSeries] = useState([]);
  const [betSum, setBetSum] = useState(0);
  const [winSum, setWinSum] = useState(0);
  const [profitSumTelegram, setProfitSumTelegram] = useState(0);
  const [betSumTelegram, setBetSumTelegram] = useState(0);
  const [winSumTelegram, setWinSumTelegram] = useState(0);
  const [bonusSum, setBonusSum] = useState(0);

  const [profitSum, setProfitSum] = useState(0);

  const handleDateChange = (dates) => {
    if (dates) {
      const start = dates[0].valueOf(); // Convert to timestamp
      const end = dates[1].valueOf(); // Convert to timestamp
      setStartedDate(start);
      setEndDate(end);
    }
  };

  useEffect(() => {
    if (!startedDate || !endDate) return;

    postUrl(sitemode,
      "/api/statistic/admin/usersRegister",
      {
        start: moment(startedDate).format("YYYY-MM-DD"),
        end: moment(endDate).format("YYYY-MM-DD"),
      },
      (data) => {
        setRegisterSum(
          data.reduce((sum, item) => sum + item.totalRegistrations, 0)
        );
        const allDates = [];
        let currentDate = moment(startedDate).startOf("day");
        const endMoment = moment(endDate).endOf("day");

        while (currentDate <= endMoment) {
          allDates.push(currentDate.format("YYYY-MM-DD"));
          currentDate = currentDate.add(1, "days");
        }
        // let add = 0;
        // Map the register data to include all dates with value 0 if missing
        const fullRegisterData = allDates.map((date, index) => {
          const dataForDate = data.find(
            (v) => moment(v._id).format("YYYY-MM-DD") === date
          );
          const dailyRegistrations = dataForDate
            ? dataForDate.totalRegistrations
            : 0;
          // add += dailyRegistrations;

          return { x: date, y: dailyRegistrations };
        });

        // console.log(fullRegisterData);

        setRegisterData(fullRegisterData);
      },
      logout
    );
    postUrl(sitemode,
      "/api/statistic/admin/profit",
      {
        start: moment(startedDate).format("YYYY-MM-DD"),
        end: moment(endDate).format("YYYY-MM-DD"),
      },
      (data) => {
        setProfitSum(data.reduce((sum, item) => sum + item.profit, 0));
        setBetSum(data.reduce((sum, item) => sum + item.totalBet, 0));
        setWinSum(data.reduce((sum, item) => sum + item.totalWin, 0));
        setBonusSum(data.reduce((sum, item) => sum + item.totalBonus, 0));
        const allDates = [];
        let currentDate = moment(startedDate).startOf("day");
        const endMoment = moment(endDate).endOf("day");

        while (currentDate <= endMoment) {
          allDates.push(currentDate.format("YYYY-MM-DD"));
          currentDate = currentDate.add(1, "days");
        }

        // Map the register data to include all dates with value 0 if missing
        const fullProfitData = allDates.map((date) => {
          const dataForDate = data.find(
            (v) => moment(v.day).format("YYYY-MM-DD") === date
          );

          return {
            x: date,
            y: dataForDate ? (dataForDate.profit || 0).toFixed(2) : 0,
          };
        });
        const fullBetData = allDates.map((date) => {
          const dataForDate = data.find(
            (v) => moment(v.day).format("YYYY-MM-DD") === date
          );

          return {
            x: date,
            y: dataForDate ? (dataForDate.totalBet || 0).toFixed(2) : 0,
          };
        });
        const fullWinData = allDates.map((date) => {
          const dataForDate = data.find(
            (v) => moment(v.day).format("YYYY-MM-DD") === date
          );

          return {
            x: date,
            y: dataForDate ? (dataForDate.totalWin || 0).toFixed(2) : 0,
          };
        });
        setProfitData(fullProfitData);
        setTotalBet(fullBetData);
        setTotalWin(fullWinData);
      },
      logout
    );
    postUrl(sitemode,
      "/api/statistic/admin/deposit",
      {
        start: moment(startedDate).format("YYYY-MM-DD"),
        end: moment(endDate).format("YYYY-MM-DD"),
        type: "deposit",
      },
      (data) => {
        setDepositSum(data.reduce((sum, item) => sum + item.totalAmount, 0));
        const allDates = [];
        let currentDate = moment(startedDate).startOf("day");
        const endMoment = moment(endDate).endOf("day");

        while (currentDate <= endMoment) {
          allDates.push(currentDate.format("YYYY-MM-DD"));
          currentDate = currentDate.add(1, "days");
        }

        const fullDepositData = allDates.map((date) => {
          const dataForDate = data.find(
            (v) => moment(v._id).format("YYYY-MM-DD") === date
          );

          return {
            x: date,
            y: dataForDate ? (dataForDate.totalAmount || 0).toFixed(2) : 0,
          };
        });
        setDeposit(fullDepositData);
      },
      logout
    );

    postUrl(sitemode,
      "/api/statistic/admin/deposit",
      {
        start: moment(startedDate).format("YYYY-MM-DD"),
        end: moment(endDate).format("YYYY-MM-DD"),
        type: "withdrawal",
      },
      (data) => {
        setWithDrawalSum(data.reduce((sum, item) => sum + item.totalAmount, 0));
        const allDates = [];
        let currentDate = moment(startedDate).startOf("day");
        const endMoment = moment(endDate).endOf("day");

        while (currentDate <= endMoment) {
          allDates.push(currentDate.format("YYYY-MM-DD"));
          currentDate = currentDate.add(1, "days");
        }

        const fullWithdrawalData = allDates.map((date) => {
          const dataForDate = data.find(
            (v) => moment(v._id).format("YYYY-MM-DD") === date
          );

          return {
            x: date,
            y: dataForDate ? (dataForDate.totalAmount || 0).toFixed(2) : 0,
          };
        });
        setWithDrawal(fullWithdrawalData);
      },
      logout
    );

    postUrl(sitemode,
      "/api/statistic/admin/usersLogin",
      {
        start: moment(startedDate).format("YYYY-MM-DD"),
        end: moment(endDate).format("YYYY-MM-DD"),
      },
      (data) => {
        // setLoginUsers(data.reduce((sum, item) => sum + item.totalAmount, 0));
        const allDates = [];
        let currentDate = moment(startedDate).startOf("day");
        const endMoment = moment(endDate).endOf("day");

        while (currentDate <= endMoment) {
          allDates.push(currentDate.format("YYYY-MM-DD"));
          currentDate = currentDate.add(1, "days");
        }

        const fullUsersData = allDates.map((date) => {
          const dataForDate = data.find(
            (v) => moment(v._id).format("YYYY-MM-DD") === date
          );

          return {
            x: date,
            y: dataForDate ? (dataForDate.count || 0).toFixed(2) : 0,
          };
        });
        setLoginUsers(fullUsersData);
      },
      logout
    );

    // *********************telegram****************

    postUrl(sitemode,
      "/api/tg/statistics/get",
      {
        period:
          moment(startedDate).format("YYYY-MM-DD") +
          " ~ " +
          moment(endDate).format("YYYY-MM-DD"),
        type: "daily",
      },
      (data) => {
        setProfitSumTelegram(
          data.reduce(
            (sum, item) => sum + (item.totalAmount - item.totalPayback),
            0
          )
        );
        setBetSumTelegram(
          data.reduce((sum, item) => sum + item.totalAmount, 0)
        );
        setWinSumTelegram(
          data.reduce((sum, item) => sum + item.totalPayback, 0)
        );

        const allDates = [];
        let currentDate = moment(startedDate).startOf("day");
        const endMoment = moment(endDate).endOf("day");

        while (currentDate <= endMoment) {
          allDates.push(currentDate.format("YYYY-MM-DD"));
          currentDate = currentDate.add(1, "days");
        }

        // Map the register data to include all dates with value 0 if missing
        const totalAmountData = allDates.map((date) => {
          const dataForDate = data.find(
            (v) => moment(v.date).format("YYYY-MM-DD") === date
          );

          return {
            x: date,
            y: dataForDate ? (dataForDate.totalAmount || 0).toFixed(2) : 0,
          };
        });

        const totalPaybackData = allDates.map((date) => {
          const dataForDate = data.find(
            (v) => moment(v.date).format("YYYY-MM-DD") === date
          );

          return {
            x: date,
            y: dataForDate ? (dataForDate.totalPayback || 0).toFixed(2) : 0,
          };
        });
        const totalProfitData = allDates.map((date) => {
          const dataForDate = data.find(
            (v) => moment(v.date).format("YYYY-MM-DD") === date
          );

          return {
            x: date,
            y: dataForDate
              ? (
                (dataForDate.totalAmount ||
                  0) - (dataForDate.totalPayback ||
                    0)
              ).toFixed(2)
              : 0,
          };
        });
        setTotalTelegramAmount(totalAmountData);
        setTotalTelegramPayback(totalPaybackData);
        setTotalTelegramProfit(totalProfitData);
      },
      logout
    );
  }, [startedDate, endDate]);

  const registerOptions = {
    chart: {
      type: "area",
      zoom: { autoScaleXaxis: true },
    },
    title: {
      text: "Registers",
      align: "center",
    },

    xaxis: {
      type: "category", // Or use "datetime" if you prefer timestamps
      tickAmount: 10,
    },
    colors: ["#ff0000"],

    stroke: {
      curve: "smooth",
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
    tooltip: {
      x: {
        format: "yyyy-MM-dd",
      },
    },
  };

  const profitOptions = {
    chart: {
      type: "area",
      zoom: { autoScaleXaxis: true },
    },
    xaxis: {
      type: "category", // Or use "datetime" if you prefer timestamps
      tickAmount: 10,
    },
    colors: ["#0000ff", "#14c4ff"],
    title: {
      text: "Profits",
      align: "center",
    },
    stroke: {
      curve: "smooth",
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
    tooltip: {
      x: {
        format: "yyyy-MM-dd",
      },
    },
  };

  useEffect(() => {
    setSeries([
      { name: "Bet", data: totalBet.map(({ x, y}) => ({ x, y: y / (prices[siteCurrency] ? prices[siteCurrency] : 1) })) },
      { name: "Win Amount", data: totalWin.map(({ x, y}) => ({ x, y: y / (prices[siteCurrency] ? prices[siteCurrency] : 1) })) },
    ]);
  }, [totalBet, totalWin]);

  const betOptions = {
    chart: {
      type: "area",
      zoom: { autoScaleXaxis: true },
    },
    xaxis: {
      type: "category", // Or use "datetime" if you prefer timestamps
      tickAmount: 10,
    },
    colors: ["#f886ff", "#0d9e41"],
    title: {
      text: "Bet vs Win Amount",
      align: "center",
    },
    stroke: {
      curve: "smooth",
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
    tooltip: {
      x: {
        format: "yyyy-MM-dd",
      },
    },
  };

  const options = {
    chart: {
      type: "area",
      zoom: { autoScaleXaxis: true },
    },
    xaxis: {
      type: "category", // Or use "datetime" if you prefer timestamps
      tickAmount: 10,
    },

    stroke: {
      curve: "smooth",
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
    tooltip: {
      x: {
        format: "yyyy-MM-dd",
      },
    },
  };

  const disabledDate = (current) => {
    // Disable dates after today (including today)
    return current && current.isAfter(moment(), "day");
  };
  return (
    <div className="mt-4">
      <RangePicker
        defaultValue={[
          dayjs(dayjs().startOf("month"), "YYYY-MM-DD"),
          dayjs(dayjs(), "YYYY-MM-DD"),
        ]}
        separator="~"
        format="YYYY-MM-DD"
        onChange={handleDateChange}
        disabledDate={disabledDate}
      />
      <div className="w-full h-full flex items-center mb-5">
        <div
          className={`md:w-[600px] w-full  p-2 mt-3 mx-auto border-solid border rounded-lg`}
          style={{ backgroundColor: profitSum > 0 ? "#33a700" : "#df5151" }}
        >
          <div className="text-[2em] font-bold text-center border-solid border-0 border-b-2 pb-2 text-white">
            Statistic
          </div>
          <div className="p-3 m-auto">
            <div className="w-full flex gap-5 mt-3">
              <div className="w-[190px] text-[1.3em] text-right text-white font-semibold">
                Accounts :
              </div>
              <div className=" text-[1.3em] text-white font-semibold">
                {registerSum}
              </div>
            </div>
            <div className="w-full flex gap-5 mt-3 mb-3">
              <div className="w-[190px]  text-[1.3em] text-right text-white font-semibold">
                Profit :
              </div>
              <div className=" text-[1.3em] text-white font-semibold">
                {((profitSum + profitSumTelegram) / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })} {prices[siteCurrency] ? siteCurrency : "USD"} (
                {((profitSum) / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })} +{" "}
                {((profitSumTelegram) / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })})
              </div>
            </div>
            <div className="w-full flex gap-5 mt-3 mb-3">
              <div className="w-[190px]  text-[1.3em] text-right text-white font-semibold">
                Bet :
              </div>
              <div className=" text-[1.3em] text-white font-semibold">
                {((betSum + betSumTelegram) / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })} {prices[siteCurrency] ? siteCurrency : "USD"} (
                {((betSum) / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })} + {((betSumTelegram) / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })})
              </div>
            </div>
            <div className="w-full flex gap-5 mt-3 mb-3">
              <div className="w-[190px]  text-[1.3em] text-right text-white font-semibold">
                Bonus :
              </div>
              <div className=" text-[1.3em] text-white font-semibold">
                - {((bonusSum) / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                  })} {prices[siteCurrency] ? siteCurrency : "USD"}
              </div>
            </div>
            <div className="w-full flex gap-5 mt-3 mb-3">
              <div className="w-[190px]  text-[1.3em] text-right text-white font-semibold">
                Win Amount :
              </div>
              <div className=" text-[1.3em] text-white font-semibold">
                {((winSum + winSumTelegram)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                   minimumFractionDigits: 0,
                   maximumFractionDigits: 2,
                   useGrouping: true,
                 })} {prices[siteCurrency] ? siteCurrency : "USD"} (
                {((winSum)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                   minimumFractionDigits: 0,
                   maximumFractionDigits: 2,
                   useGrouping: true,
                 })} + {((winSumTelegram)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                   minimumFractionDigits: 0,
                   maximumFractionDigits: 2,
                   useGrouping: true,
                 })})
              </div>
            </div>
            <div className="w-full flex gap-5 mt-3 mb-3">
              <div className="w-[190px]  text-[1.3em] text-right text-white font-semibold">
                Deposit :
              </div>
              <div className=" text-[1.3em] text-white font-semibold">
                {((depositSum)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                   minimumFractionDigits: 0,
                   maximumFractionDigits: 2,
                   useGrouping: true,
                 })} {prices[siteCurrency] ? siteCurrency : "USD"}
              </div>
            </div>
            <div className="w-full flex gap-5 mt-3 mb-3">
              <div className="w-[190px]  text-[1.3em] text-right text-white font-semibold">
                Withdraw :
              </div>
              <div className=" text-[1.3em] text-white font-semibold">
                {((withDrawalSum)/(prices[siteCurrency]?prices[siteCurrency]:1)).toLocaleString("en-US", {
                   minimumFractionDigits: 0,
                   maximumFractionDigits: 2,
                   useGrouping: true,
                 })} {prices[siteCurrency] ? siteCurrency : "USD"}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 grid-cols-1 py-3 px-10 gap-5">
        <div className="w-full">
          <ReactApexChart
            options={profitOptions}
            series={[
              { name: "BetWallet", data: profitData.map(({ x, y}) => ({ x, y: y / (prices[siteCurrency] ? prices[siteCurrency] : 1) })) },
              { name: "Telegram", data: totalTelegramProfit.map(({ x, y}) => ({ x, y: y / (prices[siteCurrency] ? prices[siteCurrency] : 1) })) },
            ]}
            type="area"
            height={350}
          />
        </div>
        <div className="w-full">
          <ReactApexChart
            options={registerOptions}
            series={[{ name: "Register", data: registerData }]}
            type="area"
            height={350}
          />
        </div>
        <div className="w-full">
          <ReactApexChart
            options={{
              ...options,
              colors: ["#b454ff"],
              title: {
                text: "Number of Logined",
                align: "center",
              },
            }}
            series={[{ name: "Logined", data: loginUsers }]}
            type="area"
            height={350}
          />
        </div>
        <div className="w-full">
          <ReactApexChart
            options={betOptions}
            series={series}
            type="area"
            height={350}
          />
        </div>
        <div className="w-full">
          <ReactApexChart
            options={{
              ...options,
              colors: ["#ff691f", "#e13291"],
              title: {
                text: "Deposit vs Withdraw",
                align: "center",
              },
            }}
            series={[
              { name: "Deposit", data: deposit.map(({ x, y}) => ({ x, y: y / (prices[siteCurrency] ? prices[siteCurrency] : 1) })) },
              {
                name: "Withdraw",
                data: withDrawal.map(({ x, y}) => ({ x, y: y / (prices[siteCurrency] ? prices[siteCurrency] : 1) })),
              },
            ]}
            type="area"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default Statistic;
