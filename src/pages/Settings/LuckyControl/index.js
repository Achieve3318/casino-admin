import React, { useEffect, useReducer, useState } from "react";
import { USER_ROLE } from '../../../constants/index';
import { useAuth } from "../../../context/AuthContext";
import postUrl from '../../../utility/postUrl';
import RuleCard, { EditCard } from './RuleCard';

const LuckyControl = () => {
  const [refresh, setRefresh] = useReducer(f => !f)
  const [refreshGood, setRefreshGood] = useReducer(f => !f)
  const [rules, setRules] = useState([])
  const [goodRules, setGoodRules] = useState([])
  const [usernames, setUsernames] = useState([])
  const [editData, setEditData] = useState(null)
  const [editGoodData, setEditGoodData] = useState(null)
  const [selData, setSelData] = useState()
  const [selGoodData, setSelGoodData] = useState()
  const { logout, sitemode } = useAuth();

  useEffect(() => {
    postUrl(sitemode, "/api/lucky/get", {}, (data) => setRules(data), logout);
  }, [refresh]);
  useEffect(() => {
    postUrl(sitemode, "/api/lucky/get", { mode: "good" }, (data) => setGoodRules(data), logout);
  }, [refreshGood]);

  useEffect(() => {
    postUrl(sitemode, "/api/user/getUsersEmail", { role: USER_ROLE.COMMON }, data => setUsernames(data.map((v, i) => ({ key: v.username, ...v }))), logout)
  }, [])

  return (<>
    <div>
      <p className="m-4 font-bold text-2xl text-slate-800">Good Luck</p>
      <div className="flex flex-wrap gap-2 md:gap-5">
        <EditCard color="blue" mode="good" allUsernames={usernames} data={null} setRefresh={setRefreshGood} />
        {goodRules.map(rule =>
          editGoodData && editGoodData._id === rule._id ?
            <EditCard key={rule._id} color="green" mode="good" allUsernames={usernames} data={rule} setRefresh={() => { setEditGoodData(null); setRefreshGood(); }} /> :
            <RuleCard key={rule._id} color="slate" data={rule} onEdit={() => setEditGoodData(rule)} setRefresh={setRefreshGood} onSelect={() => setSelGoodData(rule)} />
        )}
      </div>
      <p className="m-4 mt-[30px] font-bold text-2xl text-slate-800 border-solid border-0 border-t border-[#e0e0e0] pt-4">Bad Luck</p>
      <div className="flex justify-start flex-col">

        <div className="my-3 p-3 flex flex-col gap-3 rounded-lg shadow-sm bg-slate-200 font-sans font-semibold tracking-wide text-sm text-slate-800">
          <p>
            If an account&apos;s expected profit exceeds the profit limit and the bet amount is below the bet limit, restrictions will be applied to ensure fair play.
          </p>
          <p>
            Profit limit and bet limit are determined by the higher value between a percentage of the balance and a manual amount.
          </p>
        </div>
        <div className="mb-3 p-3 flex flex-col gap-3 rounded-lg shadow-sm bg-slate-200 font-sans font-semibold tracking-wide text-sm text-slate-800">
          <p>
            Expected Profit &gt; Max({selData ? (selData.profitLimit?.balance || 0) + '% of Balance' : 'Rate of balance'}, {selData ? '$' + (selData.profitLimit?.manual || 0) : "Manual Amount"})
          </p>
          <p>
            BetAmount &lt; Max({selData ? (selData.betLimit?.balance || 0) + '% of Balance' : 'Rate of balance'}, {selData ? '$' + (selData.betLimit?.manual || 0) : "Manual Amount"})
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 md:gap-5">
        <EditCard color="blue" allUsernames={usernames} data={null} setRefresh={setRefresh} />
        {rules.map(rule =>
          editData && editData._id === rule._id ?
            <EditCard key={rule._id} color="red" allUsernames={usernames} data={rule} setRefresh={() => { setEditData(null); setRefresh(); }} /> :
            <RuleCard key={rule._id} color="slate" data={rule} onEdit={() => setEditData(rule)} setRefresh={setRefresh} onSelect={() => setSelData(rule)} />
        )}
      </div>
    </div>
  </>);
};

export default LuckyControl;