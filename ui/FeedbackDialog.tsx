"use client";
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import type { FeedbackKind } from "@/lib/feedback";
import { submitFeedback } from "@/lib/feedback";

const Backdrop = styled.div`position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.5);display:grid;place-items:center;padding:16px;`;
const Dialog = styled.div`width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;background:${p=>p.theme.cardBg};color:${p=>p.theme.text};border:1px solid ${p=>p.theme.cardBorder};border-radius:18px;padding:24px;box-shadow:${p=>p.theme.shadow};box-sizing:border-box; h2{margin:0 0 6px} p{color:${p=>p.theme.muted};margin:0 0 18px;line-height:1.5}`;
const Label = styled.label`display:block;font-weight:700;font-size:14px;margin:14px 0 6px;`;
const Field = styled.select`width:100%;box-sizing:border-box;padding:11px;border-radius:9px;border:1px solid ${p=>p.theme.cardBorder};background:${p=>p.theme.pageBg};color:${p=>p.theme.text};font:inherit;`;
const Textarea = styled.textarea`width:100%;min-height:130px;resize:vertical;box-sizing:border-box;padding:11px;border-radius:9px;border:1px solid ${p=>p.theme.cardBorder};background:${p=>p.theme.pageBg};color:${p=>p.theme.text};font:inherit;`;
const Row = styled.div`display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:20px;`;
const Button = styled.button<{ $primary?:boolean }>`padding:10px 16px;border-radius:9px;border:1px solid ${p=>p.$primary?p.theme.accent:p.theme.cardBorder};background:${p=>p.$primary?p.theme.accent:"transparent"};color:${p=>p.$primary?"white":p.theme.text};font:inherit;font-weight:700;cursor:pointer;&:disabled{opacity:.55}`;
const Check = styled.label`display:flex;gap:9px;align-items:flex-start;margin-top:14px;font-size:14px;line-height:1.4;`;
const ErrorText = styled.div`color:${p=>p.theme.error};margin-top:10px;font-size:14px;`;

export function FeedbackDialog({ open, onClose, pagePath, attemptId, bankSlug, setId }: {open:boolean;onClose:()=>void;pagePath:string;attemptId?:string;bankSlug?:string|null;setId?:string|null}) {
  const [kind,setKind]=useState<Exclude<FeedbackKind,"post_exam">>("general");
  const [message,setMessage]=useState(""); const [allowContact,setAllowContact]=useState(false);
  const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [sent,setSent]=useState(false);
  const closeRef=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(open){setSent(false);setError("");setTimeout(()=>closeRef.current?.focus(),0)}},[open]);
  useEffect(()=>{if(!open)return;const fn=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};document.addEventListener("keydown",fn);return()=>document.removeEventListener("keydown",fn)},[open,onClose]);
  if(!open)return null;
  async function send(){setBusy(true);setError("");try{await submitFeedback({kind,message,pagePath,attemptId,bankSlug:bankSlug??undefined,setId:setId??undefined,allowContact});setSent(true);setMessage("")}catch(e){setError(e instanceof Error?e.message:"Could not send feedback.")}finally{setBusy(false)}}
  return <Backdrop onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><Dialog role="dialog" aria-modal="true" aria-labelledby="feedback-title">
    {sent?<><h2 id="feedback-title">Thank you</h2><p>Your feedback has been sent to the PMP Mastery Lab team.</p><Row><Button $primary ref={closeRef} onClick={onClose}>Done</Button></Row></>:<>
      <h2 id="feedback-title">Send feedback</h2><p>Tell us about your experience, a problem, or an improvement you would like to see.</p>
      <Label htmlFor="feedback-kind">Feedback type</Label><Field id="feedback-kind" value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value="general">General feedback</option><option value="technical">Technical problem</option><option value="complaint">Complaint</option><option value="accessibility">Accessibility</option><option value="suggestion">Suggestion</option></Field>
      <Label htmlFor="feedback-message">Details</Label><Textarea id="feedback-message" maxLength={4000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="What happened, and what would make the experience better?" />
      <Check><input type="checkbox" checked={allowContact} onChange={e=>setAllowContact(e.target.checked)}/><span>You may contact me about this feedback.</span></Check>
      {error&&<ErrorText role="alert">{error}</ErrorText>}<Row><Button ref={closeRef} onClick={onClose}>Cancel</Button><Button $primary disabled={busy||message.trim().length<5} onClick={send}>{busy?"Sending…":"Send feedback"}</Button></Row>
    </>}
  </Dialog></Backdrop>;
}
