export interface SampleContract {
  id: string;
  title: string;
  category: string;
  description: string;
  defaultPerspective: 'service_provider_or_contractor' | 'client_or_hiring_entity' | 'tenant' | 'landlord';
  content: string;
}

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: 'freelance_msa',
    title: 'Independent Contractor Agreement (Master Services)',
    category: 'Freelance & Employment',
    description: 'Contains aggressive unilateral indemnity, unlimited work-for-hire assignment of pre-existing IP, and a 2-year non-compete.',
    defaultPerspective: 'service_provider_or_contractor',
    content: `INDEPENDENT CONTRACTOR AGREEMENT

This Agreement is entered into on October 12, 2026, between Apex Global Media LLC ("Client"), located at 500 Market Street, San Francisco, CA, and Jane Doe ("Contractor"), SSN 123-45-6789, residing at 1420 Elm Street, Austin, TX (email: jane.doe@example.com, phone: 512-555-0199).

1. SERVICES AND COMPENSATION
Client agrees to pay Contractor an hourly rate of $95.00. Invoices shall be payable on a Net-90 basis following formal verification and written sign-off by Client's executive committee. Client reserves the right to withhold any payment without interest if it determines in its sole discretion that the Deliverables do not meet its subjective standards of satisfaction.

2. PROPRIETARY RIGHTS AND WORK PRODUCT
Contractor agrees that all works of authorship, designs, inventions, code, software architecture, tools, and ideas conceived, developed, or reduced to practice by Contractor during the term of this Agreement—whether or not created on Client premises or during regular business hours, and including all pre-existing tools, libraries, or frameworks utilized by Contractor—shall be the sole and exclusive property of Client from the moment of creation as a "work made for hire". Contractor irrevocably assigns and transfers to Client all worldwide right, title, patent, and copyright interest.

3. INDEMNIFICATION AND LIABILITY
Contractor shall defend, indemnify, and hold harmless Client, its officers, affiliates, agents, and employees against any and all losses, claims, damages, liabilities, judgments, settlements, penalties, costs, and expenses (including unlimited legal and attorneys' fees) arising out of or resulting from Contractor's services, performance, or alleged breach of this Agreement. Contractor's liability under this section shall be uncapped and unlimited. Client shall have no liability to Contractor under any circumstances exceeding $100.

4. RESTRICTIVE COVENANTS AND NON-COMPETE
During the term of this Agreement and for a period of twenty-four (24) months following termination for any reason, Contractor shall not directly or indirectly engage in, perform services for, consult with, or own any interest in any business, entity, or project that competes with or offers services similar to Client within North America or Europe.

5. TERMINATION AND NOTICE
Client may terminate this Agreement immediately at any time, with or without cause, upon verbal or written notice. Contractor may only terminate this Agreement upon providing ninety (90) days' advance written notice. Upon termination, Contractor shall immediately surrender all working equipment and files without retaining archive copies.

6. DISPUTE RESOLUTION AND MANDATORY ARBITRATION
Any dispute arising out of or related to this Agreement shall be resolved exclusively through confidential binding arbitration in Wilmington, Delaware under the rules of the American Arbitration Association. Contractor expressly waives any right to a trial by jury or to participate in any class action lawsuit. Contractor shall bear all filing fees, arbitrator costs, and administrative expenses of arbitration.`
  },
  {
    id: 'residential_lease',
    title: 'Residential Property Lease Agreement',
    category: 'Real Estate & Housing',
    description: 'Contains security deposit forfeiture clauses, tenant HVAC repair liabilities, and automatic 12-month renewal locks.',
    defaultPerspective: 'tenant',
    content: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement is entered into on November 1, 2026, by Landlord Highrise Properties LLC (contact: management@highriseprop.com, tel: 212-555-8822) and Tenant Michael Smith, SSN 987-65-4321, at Apartment 4B, 88 Grand Concourse, New York, NY.

1. RENT AND SECURITY DEPOSIT
The monthly rent shall be $2,850.00, payable on the first day of each calendar month. Tenant deposits $5,700.00 as a Security Deposit. Landlord may commingle the security deposit with general operating funds. If Tenant defaults on any term or vacates prior to the full term, the entire deposit shall be forfeited as liquidated damages.

2. MAINTENANCE, REPAIRS, AND HVAC
Tenant shall be solely responsible for all maintenance, repairs, and servicing of the heating, ventilation, air conditioning (HVAC) systems, plumbing fixtures, appliances, and structural windows within the premises, regardless of whether damage is caused by normal wear and tear or pre-existing mechanical defect. Landlord makes no warranties regarding habitability.

3. LANDLORD ENTRY AND INSPECTION
Landlord and its contractors reserve the right to enter the leased premises at any hour of the day or night without prior notice for purposes of inspection, appraisal, showing to prospective purchasers, or property improvements.

4. AUTOMATIC RENEWAL AND NOTICE DEADLINE
This Lease shall automatically renew for successive twelve (12) month periods at a 15% rent increase unless Tenant provides written notice of non-renewal via certified mail exactly one hundred and twenty (120) days prior to lease expiration. Verbal notices or electronic communications shall be void.

5. WAIVER OF CLAIMS AND SUBROGATION
Tenant waives any and all claims against Landlord for personal injury, water damage, electrical fires, theft, or mold exposure occurring on the premises. Tenant agrees to hold Landlord harmless against any third-party claims arising from visitors.`
  },
  {
    id: 'mutual_nda',
    title: 'Non-Disclosure Agreement (One-Sided Disguised)',
    category: 'Business & IP',
    description: 'Heavily asymmetric NDA requiring perpetual confidentiality, broad definition of secrets, and one-sided injunctive relief.',
    defaultPerspective: 'service_provider_or_contractor',
    content: `MUTUAL CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT

This Agreement is entered into between InnovateTech Inc. ("Disclosing Party") and Independent Consultant ("Receiving Party") as of December 5, 2026.

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" shall mean all technical, business, financial, customer, employee, or strategic data disclosed by Disclosing Party to Receiving Party, whether in oral, visual, or written form, and regardless of whether marked as confidential. Any general concepts or knowledge observed by Receiving Party during discussions shall be deemed Confidential Information.

2. OBLIGATIONS OF RECEIVING PARTY
Receiving Party shall hold all Confidential Information in strictest confidence and shall not disclose it to any third party or employee without prior written authorization. Receiving Party shall maintain these confidentiality obligations in perpetuity, surviving any expiration, termination, or cancellation of business discussions.

3. EXCLUSIONS FROM CONFIDENTIALITY
Information shall not be excluded from confidentiality unless Receiving Party proves by clear and convincing documentary evidence that such information was in the public domain prior to disclosure without fault of Receiving Party.

4. INJUNCTIVE RELIEF AND ATTORNEYS' FEES
Receiving Party acknowledges that any breach of this Agreement will cause irreparable injury to Disclosing Party for which monetary damages are inadequate. Disclosing Party shall be entitled to seek immediate injunctive relief without the necessity of posting a bond. Receiving Party shall pay all legal costs, court expenses, and attorneys' fees incurred by Disclosing Party in enforcing this Agreement.`
  }
];

export const SAMPLE_REVISION_COUNTER_OFFER = `INDEPENDENT CONTRACTOR AGREEMENT (PROPOSED REVISION 2)

This Agreement is entered into on October 15, 2026, between Apex Global Media LLC ("Client") and Jane Doe ("Contractor").

1. SERVICES AND COMPENSATION
Client agrees to pay Contractor an hourly rate of $95.00. Invoices shall be payable on a Net-30 basis upon delivery of milestone reports. Client shall provide written notice of any disputed charges within ten (10) business days.

2. PROPRIETARY RIGHTS AND BACKGROUND TECHNOLOGY
Contractor retains all rights, title, and interest in and to Contractor's pre-existing software tools, routines, libraries, and frameworks. Upon receipt of full payment, Contractor transfers to Client all exclusive ownership of the customized project Deliverables created specifically for Client.

3. MUTUAL INDEMNIFICATION AND LIABILITY CAP
Each party shall indemnify, defend, and hold harmless the other party from third-party claims arising directly from material breach of this Agreement or gross negligence. Neither party's aggregate monetary liability under this Agreement shall exceed total fees paid or payable in the twelve (12) months preceding the claim.

4. MUTUAL TERMINATION AND NOTICE TO CURE
Either party may terminate this Agreement upon thirty (30) days prior written notice. In the event of an alleged breach, the non-breaching party shall provide fourteen (14) days written notice and opportunity to cure before declaring default.

5. DISPUTE RESOLUTION AND GOVERNING LAW
Any dispute shall first be submitted to good-faith executive negotiation for fifteen (15) days. If unresolved, disputes shall be settled through neutral arbitration in Austin, TX, with each party bearing its own legal fees and equally sharing arbitrator expenses.`;

