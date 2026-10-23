"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { submitFeedback } from "@/lib/feedback";
import { cleanFeedbackText, feedbackCharacterHelp } from "@/lib/feedbackText";

const Card=styled.section`margin-top:20px;background:${p=>p.theme.cardBg};border:1px solid ${p=>p.theme.cardBorder};border-radius:18px;padding:clamp(18px,4vw,28px);min-width:0;box-sizing:border-box;h2{margin:0 0 6px;font-size:20px}p{color:${p=>p.theme.muted};line-height:1.5}`;
const Question=styled.fieldset`border:0;padding:0;margin:18px 0;min-width:0;legend{font-weight:700;margin-bottom:8px}`;
const Ratings=styled.div`display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;max-width:420px;`;
const Rate=styled.button<{$selected:boolean}>`min-width:0;min-height:42px;border-radius:9px;border:1px solid ${p=>p.$selected?p.theme.accent:p.theme.cardBorder};background:${p=>p.$selected?p.theme.accentSoft:p.theme.pageBg};color:${p=>p.theme.text};font:inherit;font-weight:700;cursor:pointer;`;
const Ends=styled.div`display:flex;justify-content:space-between;max-width:420px;font-size:12px;color:${p=>p.theme.muted};margin-top:5px;`;
const Textarea=styled.textarea`width:100%;min-height:90px;box-sizing:border-box;padding:10px;border-radius:9px;border:1px solid ${p=>p.theme.cardBorder};background:${p=>p.theme.pageBg};color:${p=>p.theme.text};font:inherit;resize:vertical;`;
const Actions=styled.div`display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px;`;
const Button=styled.button`padding:11px 17px;border:0;border-radius:9px;background:${p=>p.theme.accent};color:white;font:inherit;font-weight:700;cursor:pointer;&:disabled{opacity:.5}`;
const ErrorText=styled.span`color:${p=>p.theme.error};font-size:14px;`;

function Rating({label,value,onChange}:{label:string;value:number;onChange:(n:number)=>void}){return <Question><legend>{label}</legend><Ratings role="radiogroup" aria-label={label}>{[1,2,3,4,5].map(n=><Rate type="button" role="radio" aria-checked={value===n} $selected={value===n} key={n} onClick={()=>onChange(n)}>{n}</Rate>)}</Ratings><Ends><span>Poor</span><span>Excellent</span></Ends></Question>}

export function PostExamSurvey({attemptId,bankSlug,setId}:{attemptId:string;bankSlug:string;setId?:string}){
  const key=`feedback:post-exam:${attemptId}`; const [hidden,setHidden]=useState(true);
  const [overall,setOverall]=useState(0),[quality,setQuality]=useState(0),[explanations,setExplanations]=useState(0);
  const [message,setMessage]=useState(""),[allowContact,setAllowContact]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  useEffect(()=>setHidden(localStorage.getItem(key)==="1"),[key]);
  if(hidden)return null;
  async function send(){setBusy(true);setError("");try{await submitFeedback({kind:"post_exam",message:message.trim()||undefined,overallRating:overall,questionQualityRating:quality,explanationHelpfulnessRating:explanations,pagePath:window.location.pathname,attemptId,bankSlug,setId,allowContact});localStorage.setItem(key,"1");setHidden(true)}catch(e){setError(e instanceof Error?e.message:"Could not send survey.")}finally{setBusy(false)}}
  return <Card aria-labelledby="survey-title"><h2 id="survey-title">Help us improve this exam</h2><p>Optional · About one minute. Your results are already saved.</p>
    <Rating label="Overall exam experience" value={overall} onChange={setOverall}/><Rating label="Question quality" value={quality} onChange={setQuality}/><Rating label="Helpfulness of explanations" value={explanations} onChange={setExplanations}/>
    <label htmlFor="survey-comment"><strong>Anything else? (optional)</strong></label><Textarea id="survey-comment" maxLength={4000} value={message} onChange={e=>setMessage(cleanFeedbackText(e.target.value))} aria-describedby="survey-character-help" />
    <p id="survey-character-help" style={{fontSize:12,marginTop:5}}>{feedbackCharacterHelp}</p>
    <label style={{display:"flex",gap:8,marginTop:12}}><input type="checkbox" checked={allowContact} onChange={e=>setAllowContact(e.target.checked)}/> You may contact me about this feedback.</label>
    <Actions><Button disabled={busy||!overall||!quality||!explanations} onClick={send}>{busy?"Sending…":"Send survey"}</Button><button type="button" onClick={()=>{localStorage.setItem(key,"1");setHidden(true)}} style={{border:0,background:"transparent",color:"inherit",textDecoration:"underline",cursor:"pointer"}}>Not now</button>{error&&<ErrorText role="alert">{error}</ErrorText>}</Actions>
  </Card>
}
