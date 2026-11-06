/**
 * The bundled list of skills, tools, and credentials that the keyword match score looks for in a
 * job posting. No model is involved: a term counts only if the posting names it.
 *
 * Each entry is a term as it's usually written. Spellings after a "|" count as the same thing
 * ("JavaScript|JS"); the first one is what the person sees. A spelling that starts with "=" only
 * matches with that exact capitalization, for names that are also everyday words ("=Go",
 * "=Slack", "=Epic"). Short all-caps acronyms (up to three letters, like "AI" or "SQL") are
 * matched that way automatically, so "AI" doesn't match "ai" inside "Hawai'i" or a state code
 * doesn't look like a degree.
 *
 * Grow this list over time. Keep terms specific: "SQL" and "Forklift" are good, while
 * "Teamwork" or "Sales" on their own appear in nearly every posting and resume and tell the
 * person nothing.
 */
const GROUPS: Record<string, string[]> = {
  // Software and data
  languages: [
    "JavaScript|JS", "TypeScript", "Python", "Java", "C#|C sharp", "C++", "=C", "=Go|Golang", "=Rust", "=Ruby",
    "PHP", "=Swift", "Kotlin", "Scala", "=R", "MATLAB", "Perl", "=Bash", "PowerShell", "Shell scripting",
    "Objective-C", "=Dart", "Elixir", "Haskell", "Lua", "=Julia", "SAS", "Stata", "SPSS", "VBA", "COBOL",
    "Fortran", "Groovy", "Clojure", "F#", "Solidity", "Assembly language", "HTML", "CSS", "Sass", "SQL", "T-SQL",
    "PL/SQL", "NoSQL", "GraphQL", "XML", "JSON", "YAML",
  ],
  web: [
    "React|React.js|ReactJS", "Next.js", "Angular", "Vue|Vue.js", "Svelte", "Node.js|=Node|NodeJS",
    "Express.js|=Express", "Django", "Flask", "FastAPI", "Ruby on Rails|=Rails", "Spring Boot|=Spring", "ASP.NET", ".NET",
    "Laravel", "jQuery", "Tailwind", "Bootstrap", "Redux", "Webpack", "Vite", "REST|RESTful", "REST APIs",
    "APIs|API", "Microservices", "WebSockets", "OAuth", "Responsive design", "Accessibility|a11y", "WCAG",
    "SEO", "WordPress", "Shopify", "Drupal", "Salesforce Commerce Cloud",
  ],
  mobile: ["iOS", "Android", "React Native", "Flutter", "Xamarin", "SwiftUI", "Jetpack Compose", "Mobile development"],
  cloud: [
    "AWS|Amazon Web Services", "Azure|Microsoft Azure", "GCP|Google Cloud|Google Cloud Platform", "Docker",
    "Kubernetes|K8s", "Terraform", "Ansible", "=Chef", "=Puppet", "Jenkins", "GitHub Actions", "GitLab CI",
    "CircleCI", "CI/CD", "DevOps", "Linux", "Unix", "Windows Server", "Serverless", "AWS Lambda|=Lambda", "EC2", "S3",
    "CloudFormation", "=Helm", "Prometheus", "Grafana", "Datadog", "Splunk", "New Relic", "Nginx", "Apache HTTP Server",
    "Infrastructure as code", "Site reliability|SRE", "Networking", "TCP/IP", "DNS", "Load balancing",
    "VMware", "Virtualization", "Active Directory", "Office 365|Microsoft 365", "Intune", "ServiceNow",
    "Jira", "Confluence", "Git", "GitHub", "GitLab", "Bitbucket", "Agile", "Scrum", "Kanban",
  ],
  data: [
    "Excel|Microsoft Excel", "Google Sheets", "Pivot tables|Pivot table", "VLOOKUP", "XLOOKUP",
    "Power Query", "Power Pivot", "Tableau", "Power BI", "=Looker", "Looker Studio", "Qlik", "Alteryx",
    "Snowflake", "BigQuery", "Redshift", "Databricks", "Apache Spark|=Spark", "Hadoop", "Kafka", "Airflow",
    "dbt", "ETL", "ELT", "Data warehouse|Data warehousing", "Data pipelines|Data pipeline", "Data modeling",
    "Data analysis|Data analytics", "Data visualization", "Data cleaning", "Data quality", "Data governance",
    "Dashboards|Dashboard", "KPIs|KPI", "A/B testing", "Statistics|Statistical analysis",
    "Regression", "Forecasting", "Predictive modeling", "Machine learning|ML", "Deep learning", "AI",
    "Artificial intelligence", "Natural language processing|NLP", "Computer vision", "LLMs|LLM",
    "Generative AI", "TensorFlow", "PyTorch", "scikit-learn", "Keras", "pandas", "NumPy", "Jupyter",
    "PostgreSQL|Postgres", "MySQL", "SQL Server|Microsoft SQL Server", "Oracle Database|=Oracle", "MongoDB", "Redis",
    "Elasticsearch", "DynamoDB", "Cassandra", "SQLite", "Google Analytics", "Adobe Analytics", "Mixpanel",
    "=Amplitude", "Excel macros", "Business intelligence|BI",
  ],
  security: [
    "Cybersecurity|Information security", "SIEM", "SOC", "Penetration testing", "Vulnerability management",
    "Incident response", "Firewalls|Firewall", "IAM|Identity and access management", "Zero trust",
    "Encryption", "NIST", "ISO 27001", "SOC 2", "PCI DSS|PCI", "GDPR", "CCPA", "HIPAA", "FedRAMP",
    "Risk assessment", "Threat modeling", "Endpoint security",
  ],
  engineering: [
    "Software development", "Software engineering", "Object-oriented programming|OOP", "Data structures",
    "Algorithms", "System design", "Distributed systems", "Unit testing", "Test automation", "Selenium",
    "Cypress", "Playwright", "Jest", "QA|Quality assurance", "Code review", "Debugging", "Embedded systems",
    "Firmware", "PLC", "SCADA", "AutoCAD", "SolidWorks", "Revit", "CAD", "GIS", "ArcGIS", "Six Sigma",
    "Lean manufacturing", "Lean Six Sigma", "Root cause analysis", "Kaizen", "5S", "Quality control", "ISO 9001",
    "GD&T", "CNC", "Machining", "Welding", "Blueprint reading|Blueprints", "Schematics",
  ],
  design: [
    "Figma", "=Sketch", "Adobe XD", "Adobe Creative Suite|Adobe Creative Cloud", "Photoshop", "Illustrator",
    "InDesign", "Premiere Pro", "After Effects", "Final Cut Pro", "Canva", "UX|User experience",
    "UI|User interface", "UX research|User research", "Wireframing|Wireframes", "Prototyping",
    "Usability testing", "Design systems|Design system", "Typography", "Graphic design", "Motion graphics",
    "Video editing", "Photography", "Copywriting", "Content writing", "Technical writing", "Copy editing",
    "Proofreading", "AP style",
  ],
  // Business and office
  business: [
    "Project management", "Program management", "Product management", "PMP", "PRINCE2", "Stakeholder management",
    "Stakeholders|Stakeholder", "Change management", "Budgeting|Budget management", "Forecasting",
    "Financial analysis", "Financial modeling", "Financial reporting", "FP&A", "Accounting", "Bookkeeping",
    "Accounts payable", "Accounts receivable", "General ledger", "Reconciliation|Reconciliations",
    "Payroll", "Payroll processing", "Tax preparation", "Auditing|Audit", "GAAP", "IFRS", "CPA", "CMA",
    "QuickBooks", "Xero", "NetSuite", "SAP", "Oracle Financials", "=Workday", "ADP", "=Sage", "=Concur",
    "Invoicing", "Cost analysis", "Variance analysis", "Procurement", "Purchasing", "Vendor management",
    "Contract negotiation|Negotiation", "Supply chain", "Logistics", "Operations management",
    "Process improvement", "Strategic planning", "Business analysis", "Business development",
    "Market research", "Competitive analysis", "Requirements gathering", "Process mapping", "Visio",
    "Microsoft Office|MS Office", "Microsoft Word|MS Word", "PowerPoint|Microsoft PowerPoint", "=Outlook",
    "Microsoft Teams", "SharePoint", "Google Workspace|G Suite", "=Slack", "Asana", "Trello", "Monday.com",
    "Smartsheet", "=Notion", "Airtable", "Data entry", "Typing speed", "Scheduling", "Calendar management",
    "Travel coordination", "Event planning", "Office management", "Records management",
    "Multi-line phone", "Front desk", "Reception", "Administrative support", "Executive support",
    "Minute taking", "Notary",
  ],
  sales: [
    "B2B", "B2C", "SaaS", "Account management", "Key accounts", "Lead generation", "Prospecting",
    "Cold calling", "Pipeline management", "Sales quota|Quota", "Upselling", "Cross-selling", "Territory management",
    "Salesforce", "HubSpot", "CRM", "Zoho", "Pipedrive", "Salesloft", "=Gong", "LinkedIn Sales Navigator",
    "Customer success", "Client relations|Client relationships", "Customer retention", "Onboarding", "Renewals",
    "Marketing", "Digital marketing", "Content marketing", "Email marketing", "Social media",
    "Social media marketing", "SEM", "PPC", "Google Ads", "Meta Ads|Facebook Ads", "Marketing automation",
    "Marketo", "Mailchimp", "Brand management|Branding", "Public relations|PR",
    "Campaign management|Campaigns", "Market analysis", "Merchandising", "Visual merchandising", "E-commerce|Ecommerce",
    "Retail", "Grocery", "Point of sale|POS", "Cash handling", "Loss prevention", "Shrink", "Inventory",
    "Inventory management", "Inventory control", "Store operations",
  ],
  service: [
    "Customer service", "Customer support", "Customer experience", "Call center", "Help desk", "Technical support",
    "Desktop support", "IT support", "Troubleshooting", "Ticketing", "Zendesk", "Freshdesk", "=Intercom",
    "Conflict resolution", "De-escalation", "Complaint resolution", "Hospitality", "Food service",
    "Food safety", "ServSafe", "Food handler", "Bartending", "Barista", "Front of house", "Back of house",
    "Line cook", "Food preparation|Food prep", "Catering", "Housekeeping", "Janitorial", "Concierge",
  ],
  people: [
    "Human resources|HR", "Recruiting|Recruitment", "Talent acquisition", "Sourcing", "Interviewing",
    "Onboarding", "Employee relations", "Benefits administration", "Compensation", "HRIS", "=Greenhouse",
    "=Lever", "BambooHR", "Performance management", "Training and development", "Coaching",
    "Mentoring", "Team leadership", "People management", "Supervision|Supervisory", "Staff scheduling",
    "Labor relations", "Workforce planning", "Diversity, equity, and inclusion|DEI", "SHRM",
    "Employment law", "FMLA", "Leadership", "Cross-functional", "Written communication",
    "Verbal communication", "Public speaking", "Presentation skills|Presentations", "Facilitation",
    "Problem solving|Problem-solving", "Critical thinking", "Attention to detail", "Time management",
    "Organizational skills", "Multitasking", "Bilingual", "Spanish", "French",
    "Mandarin", "German", "Portuguese", "Arabic", "ASL|American Sign Language",
  ],
  // Healthcare
  healthcare: [
    "Patient care", "Patient intake", "Patient scheduling", "Vital signs", "Phlebotomy", "EKG|ECG",
    "Medication administration", "Wound care", "Triage", "Charting", "EHR|Electronic health records",
    "EMR|Electronic medical records", "Epic Systems|=Epic", "Cerner", "Meditech", "athenahealth", "Medical terminology",
    "Medical coding", "Medical billing", "ICD-10", "CPT", "HCPCS", "Revenue cycle", "Prior authorization",
    "Insurance verification", "Claims processing", "Medicare", "Medicaid", "HIPAA", "OSHA", "Infection control",
    "BLS|Basic Life Support", "ACLS", "PALS", "CPR", "First aid", "AED", "RN|Registered nurse", "LPN", "LVN",
    "CNA|Certified nursing assistant", "Medical assistant", "CMA", "EMT", "Paramedic", "NP|Nurse practitioner",
    "PA-C", "Pharmacy technician", "CPhT", "Radiology", "Sonography", "Respiratory therapy", "Physical therapy",
    "Occupational therapy", "Speech therapy", "Behavioral health", "Mental health", "Case management",
    "Care coordination", "Discharge planning", "Home health", "Hospice", "Telehealth", "Clinical research",
    "Clinical trials", "GCP|Good Clinical Practice", "IRB", "FDA", "Dental assistant", "Dental hygiene",
    "Sterilization", "Laboratory", "Specimen collection", "ICU", "Med-surg", "Pediatrics", "Geriatrics",
    "Long-term care", "Acute care", "Emergency department",
  ],
  // Education and social services
  education: [
    "Teaching", "Lesson planning", "Curriculum development", "Classroom management", "Differentiated instruction",
    "IEP|IEPs", "Special education", "ESL|ELL", "Tutoring", "Student assessment", "Google Classroom", "=Canvas",
    "Blackboard", "Moodle", "Instructional design", "E-learning", "Articulate Storyline", "Early childhood education",
    "Child care|Childcare", "Social work", "LCSW", "MSW", "Counseling", "Crisis intervention", "Advocacy",
    "Grant writing", "Fundraising", "Volunteer management", "Community outreach", "Nonprofit",
  ],
  legal: [
    "Legal research", "Legal writing", "Contract review", "Contract management", "Litigation",
    "E-discovery", "Paralegal", "Westlaw", "LexisNexis", "Compliance", "Regulatory compliance", "AML",
    "KYC", "Due diligence", "Risk management", "Underwriting", "Claims processing", "Series 7", "Series 63",
    "Series 65", "CFA", "Investment analysis", "Portfolio management", "Banking", "Mortgage lending",
    "Loan processing", "Credit analysis", "Bloomberg",
  ],
  // Trades, warehouse, and field work
  trades: [
    "Forklift|Forklift certification|Forklift certified", "Pallet jack", "Reach truck", "Order picking|Picking",
    "Packing", "Shipping and receiving|Shipping|Receiving", "Warehouse", "Warehousing", "WMS",
    "RF scanner|RF scanning", "Cycle counting|Cycle counts", "Material handling", "Loading and unloading",
    "Lifting 50 pounds|Lift 50 pounds|Lift 50 lbs|Lifting 50 lbs", "CDL|Commercial driver's license",
    "CDL Class A|Class A CDL", "CDL Class B|Class B CDL", "Hazmat", "DOT", "Clean driving record",
    "Valid driver's license|Driver's license", "Route planning", "Dispatch",
    "OSHA 10", "OSHA 30", "Safety compliance", "Lockout/tagout|LOTO", "PPE", "Hand tools",
    "Power tools", "Electrical", "Electrician", "Journeyman", "Apprenticeship", "NEC", "Plumbing",
    "HVAC", "EPA 608", "Carpentry", "Framing", "Drywall", "Painting", "Roofing", "Masonry", "Concrete",
    "Construction", "Construction management", "Estimating", "Heavy equipment",
    "Excavator", "Crane operation", "Rigging", "Preventive maintenance", "Facilities maintenance",
    "Mechanical", "Automotive", "Diesel", "ASE certification|ASE", "Assembly line", "Manufacturing",
    "Machine operation", "Quality inspection", "Landscaping", "Groundskeeping", "Pest control",
    "Security guard", "Guard card", "Surveillance", "Patrol",
  ],
  credentials: [
    "Bachelor's degree|Bachelor's|Bachelors|=BA|=BS|B.S.|B.A.", "Master's degree|Master's|Masters|M.S.|M.A.", "MBA",
    "Associate's degree|Associate degree", "PhD|Ph.D.|Doctorate", "High school diploma|GED",
    "Security clearance", "Secret clearance", "Top Secret|TS/SCI", "CompTIA A+", "CompTIA Network+|Network+",
    "CompTIA Security+|Security+", "CCNA", "CCNP", "CISSP", "CISM", "CEH", "AWS Certified",
    "Azure certification", "Google Data Analytics Certificate", "Scrum Master|CSM", "PMI-ACP", "ITIL",
    "Real estate license", "Insurance license",
  ],
};

export interface Variant {
  text: string;
  caseSensitive: boolean;
}

export interface SkillTerm {
  /** How the term is shown to the person. */
  label: string;
  /** Every spelling that counts as this term, the label first. */
  variants: Variant[];
}

const SHORT_ACRONYM = /^[A-Z0-9&/+.#-]{1,3}$/;

function parse(entry: string): SkillTerm {
  const variants = entry
    .split("|")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const text = raw.replace(/^=/, "");
      return { text, caseSensitive: raw.startsWith("=") || (SHORT_ACRONYM.test(text) && /[A-Z]/.test(text)) };
    });
  return { label: variants[0].text, variants };
}

function build(): SkillTerm[] {
  const seen = new Set<string>();
  const terms: SkillTerm[] = [];
  for (const entries of Object.values(GROUPS)) {
    for (const entry of entries) {
      const term = parse(entry);
      // A spelling listed twice (in two groups, or as one term's label and another's variant)
      // counts once, under the first entry.
      const keys = term.variants.map((v) => v.text.toLowerCase());
      if (keys.some((k) => seen.has(k))) continue;
      keys.forEach((k) => seen.add(k));
      terms.push(term);
    }
  }
  return terms;
}

export const SKILL_TERMS: readonly SkillTerm[] = build();
