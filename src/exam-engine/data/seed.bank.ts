
import type { Question } from "../core/types";

export const seedBank: Question[] = [
  // MCQ SINGLE (5)
  { id:"q-mcqs-001", type:"mcq_single", domain:"process", prompt:"A stakeholder requests a major scope change. What should the project manager do FIRST?",
    tags:["change-control","scope"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ choices:[
      {id:"a",text:"Implement the change to maintain stakeholder support"},
      {id:"b",text:"Ask the team to estimate the work and start immediately"},
      {id:"c",text:"Submit the change request for evaluation through change control"},
      {id:"d",text:"Escalate to the sponsor for approval before documenting it"}]},
    answerKey:{ correctChoiceId:"c" },
    explanation:"Formal change control ensures impact analysis and proper approval before changing scope."
  },
  { id:"q-mcqs-002", type:"mcq_single", domain:"people", prompt:"Two team members are in conflict over technical decisions. What is the BEST first action?",
    tags:["conflict","leadership"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ choices:[
      {id:"a",text:"Use forcing to quickly decide and move forward"},
      {id:"b",text:"Facilitate a discussion to reach a collaborative agreement"},
      {id:"c",text:"Remove one team member from the project"},
      {id:"d",text:"Ignore it if schedule is still on track"}]},
    answerKey:{ correctChoiceId:"b" },
    explanation:"Collaborating/problem-solving is generally preferred for long-term resolution."
  },
  { id:"q-mcqs-003", type:"mcq_single", domain:"business_environment", prompt:"A new regulation impacts your deliverable. What should you do NEXT?",
    tags:["compliance","requirements"], difficulty:3, version:1, accessTier:"free", setId:"free",
    payload:{ choices:[
      {id:"a",text:"Continue as planned until the regulation is enforced"},
      {id:"b",text:"Update requirements and assess impacts with stakeholders"},
      {id:"c",text:"Ask procurement to renegotiate all contracts"},
      {id:"d",text:"Stop work immediately and wait for executive direction"}]},
    answerKey:{ correctChoiceId:"b" },
    explanation:"Regulatory changes require requirements alignment and impact assessment."
  },
  { id:"q-mcqs-004", type:"mcq_single", domain:"process", prompt:"A project is behind schedule due to underestimated work. What is the most appropriate action?",
    tags:["planning","schedule"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ choices:[
      {id:"a",text:"Crash the schedule without analyzing risk"},
      {id:"b",text:"Update the schedule baseline immediately"},
      {id:"c",text:"Re-estimate remaining work and update the plan accordingly"},
      {id:"d",text:"Reduce quality to meet schedule"}]},
    answerKey:{ correctChoiceId:"c" },
    explanation:"Re-estimating and replanning is appropriate before selecting compression tactics."
  },
  { id:"q-mcqs-005", type:"mcq_single", domain:"people", prompt:"A team is disengaged and missing sprint commitments. What should the PM do first?",
    tags:["agile","retrospective"], difficulty:3, version:1, accessTier:"free", setId:"free",
    payload:{ choices:[
      {id:"a",text:"Increase reporting requirements and daily status meetings"},
      {id:"b",text:"Hold a retrospective to identify root causes and improve collaboration"},
      {id:"c",text:"Replace the team members who miss commitments"},
      {id:"d",text:"Escalate to the sponsor immediately"}]},
    answerKey:{ correctChoiceId:"b" },
    explanation:"In Agile/Hybrid, retrospectives and removing impediments are primary levers."
  },

  // MCQ MULTI (5)
  { id:"q-mcqm-001", type:"mcq_multi", domain:"process", prompt:"Which actions help prevent scope creep? (Select TWO)",
    tags:["scope","requirements"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ minSelections:2, maxSelections:2, choices:[
      {id:"a",text:"Use a formal change control process"},
      {id:"b",text:"Accept small changes without documentation"},
      {id:"c",text:"Maintain a requirements traceability matrix"},
      {id:"d",text:"Avoid stakeholder reviews to reduce feedback"}]},
    answerKey:{ correctChoiceIds:["a","c"], scoring:"strict" },
    explanation:"Change control + RTM are classic controls against uncontrolled scope expansion."
  },
  { id:"q-mcqm-002", type:"mcq_multi", domain:"people", prompt:"Which behaviors align with servant leadership? (Select TWO)",
    tags:["leadership","agile"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ minSelections:2, maxSelections:2, choices:[
      {id:"a",text:"Removing impediments for the team"},
      {id:"b",text:"Assigning tasks without team input"},
      {id:"c",text:"Coaching and enabling team decision-making"},
      {id:"d",text:"Prioritizing personal authority over collaboration"}]},
    answerKey:{ correctChoiceIds:["a","c"], scoring:"strict" },
    explanation:"Servant leadership focuses on enabling, coaching, and removing blockers."
  },
  { id:"q-mcqm-003", type:"mcq_multi", domain:"business_environment", prompt:"Which items are typically considered external constraints? (Select TWO)",
    tags:["constraints","external"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ minSelections:2, maxSelections:2, choices:[
      {id:"a",text:"Regulations"},
      {id:"b",text:"Team working agreement"},
      {id:"c",text:"Market conditions"},
      {id:"d",text:"Internal coding standards"}]},
    answerKey:{ correctChoiceIds:["a","c"], scoring:"strict" },
    explanation:"Regulations and markets are external to the project organization."
  },
  { id:"q-mcqm-004", type:"mcq_multi", domain:"process", prompt:"Which are valid risk responses? (Select TWO)",
    tags:["risk"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ minSelections:2, maxSelections:2, choices:[
      {id:"a",text:"Avoid"},
      {id:"b",text:"Gold-plate"},
      {id:"c",text:"Transfer"},
      {id:"d",text:"Over-allocate resources by default"}]},
    answerKey:{ correctChoiceIds:["a","c"], scoring:"strict" },
    explanation:"Avoid/Transfer are standard responses."
  },
  { id:"q-mcqm-005", type:"mcq_multi", domain:"people", prompt:"Which actions improve stakeholder engagement? (Select TWO)",
    tags:["stakeholders"], difficulty:3, version:1, accessTier:"free", setId:"free",
    payload:{ minSelections:2, maxSelections:2, choices:[
      {id:"a",text:"Create a stakeholder engagement plan"},
      {id:"b",text:"Limit communication to monthly updates only"},
      {id:"c",text:"Tailor communications to stakeholder needs"},
      {id:"d",text:"Exclude negative stakeholders to reduce risk"}]},
    answerKey:{ correctChoiceIds:["a","c"], scoring:"strict" },
    explanation:"Planning + tailoring communications increases alignment."
  },

  // DND MATCH (5)
  { id:"q-dndm-001", type:"dnd_match", domain:"process", prompt:"Match the risk response to its description.",
    tags:["risk"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ prompts:[{id:"p1",text:"Avoid"},{id:"p2",text:"Mitigate"},{id:"p3",text:"Transfer"}],
             answers:[{id:"a1",text:"Eliminate the threat by changing the plan"},{id:"a2",text:"Reduce probability or impact"},{id:"a3",text:"Shift impact to a third party"}]},
    answerKey:{ mapping:{ p1:"a1", p2:"a2", p3:"a3" } }
  },
  { id:"q-dndm-002", type:"dnd_match", domain:"people", prompt:"Match the conflict technique to the example.",
    tags:["conflict"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ prompts:[{id:"p1",text:"Collaborate"},{id:"p2",text:"Compromise"},{id:"p3",text:"Force"}],
             answers:[{id:"a1",text:"Find a win-win solution addressing root causes"},{id:"a2",text:"Each side gives up something to reach agreement"},{id:"a3",text:"One party imposes a solution using authority"}]},
    answerKey:{ mapping:{ p1:"a1", p2:"a2", p3:"a3" } }
  },
  { id:"q-dndm-003", type:"dnd_match", domain:"process", prompt:"Match the artifact to its primary purpose.",
    tags:["artifacts"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ prompts:[{id:"p1",text:"WBS"},{id:"p2",text:"RAID log"},{id:"p3",text:"RTM"}],
             answers:[{id:"a1",text:"Decompose scope into manageable work"},{id:"a2",text:"Track risks, assumptions, issues, and dependencies"},{id:"a3",text:"Link requirements to deliverables and tests"}]},
    answerKey:{ mapping:{ p1:"a1", p2:"a2", p3:"a3" } }
  },
  { id:"q-dndm-004", type:"dnd_match", domain:"business_environment", prompt:"Match the factor to external vs internal.",
    tags:["external","internal"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ prompts:[{id:"p1",text:"Regulatory policy"},{id:"p2",text:"Org culture"},{id:"p3",text:"Market demand"}],
             answers:[{id:"a1",text:"External"},{id:"a2",text:"Internal"}]},
    answerKey:{ mapping:{ p1:"a1", p2:"a2", p3:"a1" } }
  },
  { id:"q-dndm-005", type:"dnd_match", domain:"people", prompt:"Match the communication type to the best use.",
    tags:["communications"], difficulty:3, version:1, accessTier:"free", setId:"free",
    payload:{ prompts:[{id:"p1",text:"Interactive"},{id:"p2",text:"Push"},{id:"p3",text:"Pull"}],
             answers:[{id:"a1",text:"Real-time discussions (meetings, calls)"},{id:"a2",text:"Sent to recipients (emails, memos)"},{id:"a3",text:"Stored for access (portals, repositories)"}]},
    answerKey:{ mapping:{ p1:"a1", p2:"a2", p3:"a3" } }
  },

  // DND ORDER (5)
  { id:"q-dndo-001", type:"dnd_order", domain:"process", prompt:"Order the steps for handling a change request.",
    tags:["change-control"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ items:[{id:"i1",text:"Document the change request"},{id:"i2",text:"Analyze impact (scope/schedule/cost/risk)"},{id:"i3",text:"Obtain approval/rejection through governance"},{id:"i4",text:"Update plans and communicate decision"}]},
    answerKey:{ orderedIds:["i1","i2","i3","i4"] }
  },
  { id:"q-dndo-002", type:"dnd_order", domain:"people", prompt:"Order a typical coaching approach to improve performance.",
    tags:["leadership"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ items:[{id:"i1",text:"Clarify expectations"},{id:"i2",text:"Understand obstacles/root causes"},{id:"i3",text:"Agree on actions/support"},{id:"i4",text:"Follow up and reinforce improvements"}]},
    answerKey:{ orderedIds:["i1","i2","i3","i4"] }
  },
  { id:"q-dndo-003", type:"dnd_order", domain:"process", prompt:"Order the basic risk management flow.",
    tags:["risk"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ items:[{id:"i1",text:"Identify risks"},{id:"i2",text:"Analyze risks"},{id:"i3",text:"Plan responses"},{id:"i4",text:"Monitor risks"}]},
    answerKey:{ orderedIds:["i1","i2","i3","i4"] }
  },
  { id:"q-dndo-004", type:"dnd_order", domain:"business_environment", prompt:"Order steps to respond to a new compliance requirement.",
    tags:["compliance"], difficulty:3, version:1, accessTier:"free", setId:"free",
    payload:{ items:[{id:"i1",text:"Confirm requirement and effective date"},{id:"i2",text:"Assess impacts and stakeholders"},{id:"i3",text:"Update requirements and plans"},{id:"i4",text:"Validate compliance and document evidence"}]},
    answerKey:{ orderedIds:["i1","i2","i3","i4"] }
  },
  { id:"q-dndo-005", type:"dnd_order", domain:"process", prompt:"Order the steps to close a project or phase.",
    tags:["closing"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ items:[{id:"i1",text:"Confirm deliverable acceptance"},{id:"i2",text:"Transfer ownership/operations"},{id:"i3",text:"Capture lessons learned"},{id:"i4",text:"Archive documents and release resources"}]},
    answerKey:{ orderedIds:["i1","i2","i3","i4"] }
  },

  // HOTSPOT (5)
  { id:"q-hot-001", type:"hotspot", domain:"process", prompt:"On the risk matrix image, click the High Impact / High Probability area.",
    tags:["risk"], difficulty:2, version:1, accessTier:"free", setId:"free",
    media:{ imageUrl:"/images/risk-matrix.png", alt:"Risk matrix" },
    payload:{ coordinateSpace:"percent", regions:[
      {id:"r1",shape:"rect",x:70,y:0,w:30,h:30},
      {id:"r2",shape:"rect",x:0,y:70,w:30,h:30},
      {id:"r3",shape:"rect",x:70,y:70,w:30,h:30}]},
    answerKey:{ correctRegionId:"r3" }
  },
  { id:"q-hot-002", type:"hotspot", domain:"people", prompt:"Click the High influence / High interest area on the stakeholder grid.",
    tags:["stakeholders"], difficulty:2, version:1, accessTier:"free", setId:"free",
    media:{ imageUrl:"/images/stakeholder-grid.png", alt:"Stakeholder grid" },
    payload:{ coordinateSpace:"percent", regions:[
      {id:"r1",shape:"rect",x:70,y:70,w:30,h:30},
      {id:"r2",shape:"rect",x:70,y:0,w:30,h:30},
      {id:"r3",shape:"rect",x:0,y:70,w:30,h:30}]},
    answerKey:{ correctRegionId:"r1" }
  },
  { id:"q-hot-003", type:"hotspot", domain:"process", prompt:"Click the center segment in the network diagram (demo hotspot).",
    tags:["schedule"], difficulty:1, version:1, accessTier:"free", setId:"free",
    media:{ imageUrl:"/images/network.png", alt:"Network diagram" },
    payload:{ coordinateSpace:"percent", regions:[
      {id:"r1",shape:"rect",x:10,y:40,w:30,h:20},
      {id:"r2",shape:"rect",x:45,y:40,w:30,h:20},
      {id:"r3",shape:"rect",x:80,y:40,w:15,h:20}]},
    answerKey:{ correctRegionId:"r2" }
  },
  { id:"q-hot-004", type:"hotspot", domain:"business_environment", prompt:"Click the bottom band (demo compliance boundary).",
    tags:["compliance"], difficulty:1, version:1, accessTier:"free", setId:"free",
    media:{ imageUrl:"/images/compliance.png", alt:"Compliance diagram" },
    payload:{ coordinateSpace:"percent", regions:[
      {id:"r1",shape:"rect",x:0,y:0,w:50,h:50},
      {id:"r2",shape:"rect",x:50,y:0,w:50,h:50},
      {id:"r3",shape:"rect",x:0,y:50,w:100,h:50}]},
    answerKey:{ correctRegionId:"r3" }
  },
  { id:"q-hot-005", type:"hotspot", domain:"process", prompt:"Click the middle third (demo accepted risk).",
    tags:["risk"], difficulty:1, version:1, accessTier:"free", setId:"free",
    media:{ imageUrl:"/images/risk-response.png", alt:"Risk response chart" },
    payload:{ coordinateSpace:"percent", regions:[
      {id:"r1",shape:"rect",x:0,y:0,w:33,h:100},
      {id:"r2",shape:"rect",x:33,y:0,w:34,h:100},
      {id:"r3",shape:"rect",x:67,y:0,w:33,h:100}]},
    answerKey:{ correctRegionId:"r2" }
  },

  // FILL BLANK (5)
  { id:"q-fill-001", type:"fill_blank", domain:"process", prompt:"If EV = 120 and AC = 100, what is CPI? (2 decimals)",
    tags:["evm"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ inputMode:"numeric", blanks:[{id:"b1",placeholder:"CPI"}] },
    answerKey:{ values:{ b1:["1.2","1.20"] }, numericTolerance:0.01 }
  },
  { id:"q-fill-002", type:"fill_blank", domain:"process", prompt:"If PV = 200 and EV = 150, what is SPI? (2 decimals)",
    tags:["evm"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ inputMode:"numeric", blanks:[{id:"b1",placeholder:"SPI"}] },
    answerKey:{ values:{ b1:["0.75"] }, numericTolerance:0.01 }
  },
  { id:"q-fill-003", type:"fill_blank", domain:"people", prompt:"The conflict technique focused on a win-win solution is called ________.",
    tags:["conflict"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ inputMode:"text", blanks:[{id:"b1",placeholder:"Technique"}] },
    answerKey:{ values:{ b1:["collaboration","collaborate","problem solving","problem-solving"] }, caseInsensitive:true }
  },
  { id:"q-fill-004", type:"fill_blank", domain:"business_environment", prompt:"A mandatory requirement from a government agency is a ________ constraint.",
    tags:["constraints"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ inputMode:"text", blanks:[{id:"b1",placeholder:"Type"}] },
    answerKey:{ values:{ b1:["regulatory"] }, caseInsensitive:true }
  },
  { id:"q-fill-005", type:"fill_blank", domain:"process", prompt:"Typical formula: EAC = BAC / ________",
    tags:["evm"], difficulty:2, version:1, accessTier:"free", setId:"free",
    payload:{ inputMode:"text", blanks:[{id:"b1",placeholder:"Metric"}] },
    answerKey:{ values:{ b1:["cpi"] }, caseInsensitive:true }
  }
];
