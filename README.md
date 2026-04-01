# HealthCare Assistant

A modern healthcare web application providing symptom checking, doctor discovery, appointment booking, and emergency services using external APIs.

# Live Application

   Access Type          URL   
                                      
   Load Balancer     http://3.86.177.152   
    Web01 (Primary)     http://13.221.234.18   
    Web02 (Secondary)     http://13.83.134.172   

# Health assistant web link
http://3.86.177.152:80
Note:Ensure the correct link url is used to access the web.

  # 🎯 Features Implemented

  # Core Functionality
     ✅  Symptom Checker  - with disease diagnosis and suggestions depending on the symptoms
     ✅  Doctor Discovery  - via filtered search and a live regex search tool
     ✅  Emergency Contacts   - based on real-time geolocation using IPAPI with an implemented live location feature through the incorporation of Google Maps to triangulate the location based on the latitude and longitude provided by the IPAPI on users location
     ✅  BMI Calculator  - with visual feedback
     ✅  Appointment Booking  - with Google Calendar sync and notifications tool powered by Twilio API
     ✅  User Authentication   - LocalStorage-based for security. Upgrades are being done using firebase api
     ✅  Dark/Light Mode Toggle for interactive and accessible screens
     ✅  Offline Support  (Service Worker + PWA)
     ✅  Toast Notifications  for user feedback

  # External APIs Used
   API    Purpose    Credits   
                                                  
    IPApi.co                Location detection for emergency contacts    https://ipapi.co/   
    Google Maps             Location sharing                             https://developers.google.com/maps   
    NPPES ClinicalTables     US provider database                        https://data.nist.gov/published/dataset/NPPES+Data+Release   
    Twilio SMS                    Appointment reminders (optional)         https://www.twilio.com   

  # Backend Infrastructure

     ✅ Load Balancer: HAProxy configured on Lb01
     ✅ Web Servers:    Nginx on Web01 and Web02
     ✅ Database: Firebase Realtime Database and/or LocalStorage fallback
     ✅ Authentication: Session-based using LocalStorage

  # Credentials security features
    .env file
    .gitignore file
    Firebase free api for authentication and Firebase Realtime Database

 #  Live demo
    https://www.loom.com/share/8e04789e37774de4ae69749a30e556b5

  # 🛠️ Installation & Setup

  # Prerequisites
     Node.js (v14+)
     Modern browser (Chrome, Firefox, Safari, Edge)

  # Local Development
```bash
# Clone repository
git clone https://github.com/mwiti-fidelis/Health-Assistant.git
cd Health-Assistant

# configure API's
# Open index.html in browser
# OR use live server
npm install -g serve
npx serve
serve .


