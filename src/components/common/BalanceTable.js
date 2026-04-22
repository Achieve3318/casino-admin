import React from "react";
import { Table, Tag } from "antd";
import { useAuth } from "../../context/AuthContext";

const BalanceTable = ({ data, loading = false }) => {
    const { prices, siteCurrency } = useAuth();

    if (!data) return null;

    const { currentBalances = [], today = {}, date, dateRange } = data;

    const formatDateTimeLabel = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatToSiteCurrency = (usdValue = 0) => (
        ((usdValue || 0) / (prices[siteCurrency] ? prices[siteCurrency] : 1)).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true,
        })
    );

    // Determine date label for display
    let dateLabel = "(Today)";
    if (dateRange && dateRange.startDate && dateRange.endDate) {
        const startDate = formatDateTimeLabel(dateRange.startDate);
        const endDate = formatDateTimeLabel(dateRange.endDate);
        if (startDate === endDate) {
            dateLabel = `(${startDate})`;
        } else {
            dateLabel = `(${startDate} - ${endDate})`;
        }
    } else if (date) {
        dateLabel = `(${date})`;
    }

    // Prepare data for the main summary table
    const summaryData = [
        {
            key: 'totalBalance',
            metric: 'Total Balance',
            value:
                formatToSiteCurrency(currentBalances[0]?.totalBalanceUSD || 0),
            currency: ((prices[siteCurrency] ? siteCurrency : "USD")),
        },
        {
            key: 'totalDeposits',
            metric: `Total Deposits `,
            value: formatToSiteCurrency(today.depositsUSD || 0),
            currency: ((prices[siteCurrency] ? siteCurrency : "USD")),
        },
        {
            key: 'totalBets',
            metric: `Total Bets `,
            value: formatToSiteCurrency(today.betsUSD || 0),
            currency: ((prices[siteCurrency] ? siteCurrency : "USD")),
        },
        {
            key: 'totalBonuses',
            metric: `Total Bonuses `,
            value: formatToSiteCurrency(today.bonusesUSD || 0),
            currency: ((prices[siteCurrency] ? siteCurrency : "USD")),
        },
        {
            key: 'totalWithdrawals',
            metric: `Successful Withdrawals`,
            value: formatToSiteCurrency(today.withdrawalsUSD || 0),
            currency: ((prices[siteCurrency] ? siteCurrency : "USD")),
        }
    ];

    // Prepare data for the detailed balance breakdown


    const summaryColumns = [
        {
            title: 'Metric',
            dataIndex: 'metric',
            key: 'metric',
            width: '40%',
            className: 'font-medium'
        },
        {
            title: 'Amount',
            dataIndex: 'value',
            key: 'value',
            width: '30%',
            align: 'right',
            render: (value) =>
                value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    useGrouping: true,
                })
        },
        {
            title: 'Currency',
            dataIndex: 'currency',
            key: 'currency',
            width: '15%',
            align: 'center'
        },
    ];


    return (
        <div className="max-w-[500px] space-y-4 mx-auto">
            {/* Summary Table */}
            <div>
                <Table
                    columns={summaryColumns}
                    dataSource={summaryData}
                    pagination={false}
                    size="small"
                    bordered
                    loading={loading}
                    className="mb-4"
                />
            </div>
        </div>
    );
};

export default BalanceTable;
