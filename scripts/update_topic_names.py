import json, os
names = {
"EA:T001": "Number Sense & Counting",
"EA:T002": "Basic Addition",
"EA:T003": "Basic Subtraction",
"EA:T004": "Place Value",
"EA:T005": "Multi-Digit Addition",
"EA:T006": "Multi-Digit Subtraction",
"EA:T007": "Introduction to Multiplication",
"EA:T008": "Introduction to Division",
"EA:T009": "Introduction to Fractions",
"EA:T010": "Basic Measurement",
"EA:T011": "Estimation and Rounding",
"EA:T012": "Properties of Operations",
"EA:T013": "Factors and Multiples",
"EA:T014": "Multi-Digit Multiplication (Advanced)",
"EA:T015": "Division with Remainders & Long Division Basics",
"EA:T016": "Comparing and Ordering Fractions",
"EA:T017": "Equivalent Fractions (Advanced)",
"EA:T018": "Improper Fractions and Mixed Numbers",
"EA:T019": "Addition and Subtraction of Fractions",
"EA:T020": "Multiplication of Fractions by Whole Numbers",
"EA:T021": "Decimal Concepts and Place Value",
"EA:T022": "Comparing and Ordering Decimals",
"EA:T023": "Addition and Subtraction of Decimals (Simple Cases)",
"EA:T024": "Advanced Time Measurement",
"EA:T025": "Advanced Money Skills",
"EA:T026": "Capacity and Volume (Introduction)",
"EA:T027": "Weight and Mass (Extended)",
"EA:T028": "Temperature (Introduction)",
"EA:T029": "Perimeter and Area (Introduction)",
"EA:T030": "2D Shapes - Identification and Properties",
"EA:T031": "3D Shapes - Identification and Properties",
"EA:T032": "Collecting and Representing Data",
"EA:T033": "Interpreting Data",
"EA:T034": "Multi-Step Word Problems"
}
base='course/EA/topics'
for fname in os.listdir(base):
    path=os.path.join(base,fname)
    with open(path) as f:
        data=json.load(f)
    data['name']=names.get(data['id'],'')
    with open(path,'w') as f:
        json.dump(data,f,indent=2)
