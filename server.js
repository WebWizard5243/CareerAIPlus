import express from "express";
import pg from "pg";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import bodyParser from "body-parser";
import dotenv from "dotenv"; 
import { google } from "googleapis";
import { DateTime } from "luxon";
import { v4 as uuid } from 'uuid';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import fs from "fs";
import multer from "multer";
import { Document, Packer, Paragraph, TextRun } from "docx";
import path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config(); 

const app = express();
const port = process.env.PORT;
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const upload = multer({ dest: "uploads/" });
const router = express.Router();


// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

;

// PostgreSQL Database Connection

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);





  async function main(skills, interests, aspiration) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Based on the given skills: ${skills}, interests: ${interests}, aspirations: ${aspiration}, provide three potential career paths in **valid JSON format**, without markdown or extra formatting:
      {
        "header": "Brief introduction about the career paths based on the given skills and interests.",
        "careerPaths": [
          {
            "title": "Category of Career Path",
            "path": "Specific Career Title(s)",
            "description": "Detailed explanation of how this career path aligns with the given skills and interests."
          },
          {
            "title": "Another Career Category",
            "path": "Another set of Career Titles",
            "description": "Another detailed explanation."
          }
        ]
      }`
    });
    const aiResponseText = response.candidates[0].content.parts[0].text;

    // console.log("Raw AI Response:", aiResponseText);

    const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();
    const parsedResponse = JSON.parse(cleanJson);
    return parsedResponse;
  }

app.get("/", (req,res) => {
  res.render("index.ejs");
})

app.get("/careerAssessment" , (req,res) => {
  res.render("careerAssesment.ejs");
})
app.get("/learningRoadmaps" , (req,res) => {
  res.render("Learning.ejs");
})
app.get("/MentorshipConnection" , (req,res) => {
  res.render("mentorshipConnection.ejs");
})
app.get("/ResumeReview" , (req,res) => {
  res.render("resumeBuilder.ejs");
})
app.get("/careerCounselling", (req,res) => {
  res.render("careerCounselling.ejs");
})
app.get("/Scholarships", (req,res) => {
  res.render("scholarship.ejs");
})

app.post("/careerAssessment" ,async(req,res) => {
  try {
  const skills = req.body.skills;
  const interests = req.body.interests;
  const aspiration = req.body.aspiration;

 const response = await main(skills, interests, aspiration);

//  console.log("AI Response:", response); // 🔍 Debugging: Check response from AI

 if (!response || !response.careerPaths) {
   return res.render("careerAssesment.ejs", { data: null }); // Handle missing data
 }

 res.render("careerAssesment.ejs", { data: response });
} catch (err) {
 console.error("Error fetching career suggestions:", err);
 res.render("careerAssesment.ejs", { data: null }); // Handle error gracefully
}
});


// Step 1: Redirect user to Google's OAuth page
app.get("/auth", (req, res) => {
  const { date, time } = req.query;
  const scopes = ["https://www.googleapis.com/auth/calendar.events"];
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state : JSON.stringify({ date, time }),
  });
  res.redirect(url);
});


// Step 2: Handle OAuth callback and create event
// Step 2: Handle OAuth callback and create event
app.get("/auth/callback", async(req, res) => {
  const code = req.query.code;
  
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  
  const state = JSON.parse(req.query.state);
  const date = state.date;
  const time = state.time;
  
  const start = DateTime.fromISO(`${date}T${time}`, { zone: "Asia/Kolkata" });
  const end = start.plus({ hours: 2 });
  
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  
  // Create a Zoom meeting
  // Note: You would need to set up Zoom API credentials and SDK
  const zoomMeeting = await createZoomMeeting({
    topic: "Career Counseling Session",
    start_time: start.toISO(),
    duration: 120, // 2 hours in minutes
    timezone: "Asia/Kolkata"
  });
  
  // Create an event with Zoom details
  const event = {
    summary: "Career Counseling Session",
    description: `One-on-one session with a mentor.\n\nJoin Zoom Meeting:\n${zoomMeeting.join_url}\n\nMeeting ID: ${zoomMeeting.id}\nPasscode: ${zoomMeeting.password}`,
    start: {
      dateTime: start.toISO(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: end.toISO(),
      timeZone: "Asia/Kolkata",
    },
    // attendees: [{ email: "student@example.com" }],
    conferenceData: {
      createRequest: {
        requestId: uuid(), // You'll need to add a UUID generator
        conferenceSolutionKey: {
          type: "hangoutsMeet" // Alternative Google Meet integration
        }
      }
    }
  };
  
  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    conferenceDataVersion: 1 // Required for conference data
  });
  
  res.render("mentorshipConnection.ejs", {
    link: response.data.htmlLink,
    zoomLink: zoomMeeting.join_url,
    zoomMeetingId: zoomMeeting.id,
    zoomPassword: zoomMeeting.password
  });
});


async function createZoomMeeting(meetingDetails) {
  try {
    console.log("🚀 Requesting Zoom token...");

    const tokenResponse = await axios.post(
      'https://zoom.us/oauth/token',
      null,
      {
        params: {
          grant_type: 'account_credentials',
          account_id: process.env.ZOOM_ACCOUNT_ID
        },
        auth: {
          username: process.env.ZOOM_CLIENT_ID,
          password: process.env.ZOOM_CLIENT_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log("✅ Zoom Access Token:", accessToken);

    // You can use 'me' as userId if it's just your Zoom account
    const zoomMeetingRes = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: meetingDetails.topic || "Career Counseling Session",
        type: 2, // Scheduled meeting
        start_time: DateTime.fromISO(meetingDetails.start_time, { zone: "Asia/Kolkata" }).toUTC().toISO(),
        duration: meetingDetails.duration || 120,
        timezone: "Asia/Kolkata",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          waiting_room: true
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📅 Zoom Meeting created successfully.");
    return zoomMeetingRes.data;

  } catch (error) {
    console.error('❌ Error creating Zoom meeting:', error.response?.data || error.message);
    throw error;
  }
}
                //Resume Review   
                app.post("/ResumeReview", upload.single("resume"), async (req, res) => {
                  try {
                    const resumePath = req.file.path;
                    const dataBuffer = fs.readFileSync(resumePath);
                    const data = await pdf(dataBuffer);
                
                    const review = await ai.models.generateContent({
                      model: "gemini-2.0-flash",
                      contents: [
                        {
                          role: "user",
                          parts: [{
                            text: `You are a professional career coach. Review this résumé : ${data.text} and provide feedback on formatting, clarity, grammar. Also rate it on a scale of 1–10.Keep the review short every providing review on each of the given options in a small paragraph. Please return your response strictly in valid JSON format like this:
                {
                  "summary": "Your brief summary here...",
                  "formattingFeedback": "...",
                  "clarityFeedback": "...",
                  "grammarFeedback": "...",
                  "relevanceFeedback": "...",
                  "rating": 8
                }
                `
                          }]
                        }
                      ]
                    });
                
                    const aiResponseText = review.candidates[0].content.parts[0].text;
                    const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();
                
                    // Try parsing and fallback if fails
                    let parsedResponse;
                    try {
                      parsedResponse = JSON.parse(cleanJson);
                    } catch (jsonErr) {
                      console.warn("❗AI did not return JSON:", cleanJson);
                      return res.status(500).json({
                        error: "AI response was not in expected JSON format",
                        response: cleanJson
                      });
                    }
                    
                    const prompt = `
      You are a career counselor and resume expert. Generate **3 unique sample résumés** in plain text format to imporve the given resume : ${data.text}.
      - Resume 1: Modern tech-savvy format
      - Resume 2: Clean minimal design
      - Resume 3: Creative or visually styled layout

      Each should include:
      - Name
      - Professional Summary
      - Skills
      - Education
      - Work Experience
      - Projects
      - Certifications

      Respond with valid JSON like this:
      {
        "resumes": [
          {
            "title": "Modern Tech Format",
            "content": "Resume content here..."
          },
          {
            "title": "Minimalist Clean Format",
            "content": "Resume content here..."
          },
          {
            "title": "Creative Designer Format",
            "content": "Resume content here..."
          }
        ]
      }
    `;

    const resume = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    });

    const textResponse = resume.candidates[0].content.parts[0].text;
    const jsonString = textResponse.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonString);
    const generatedDir = path.join(process.cwd(), "generated");
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir);
}
    // Generate .docx files for each resume
    const generatedFiles = await Promise.all(
      parsed.resumes.map(async (resume, idx) => {
        const doc = new Document({
          sections: [
            {
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: resume.title, bold: true, size: 32 }),
                  ],
                }),
                new Paragraph(resume.content),
              ],
            },
          ],
        });

        const buffer = await Packer.toBuffer(doc);
        const fileName = `Resume_Template_${idx + 1}.docx`;
        const filePath = path.join(generatedDir, fileName);
        if (!fs.existsSync("generated")) {
          fs.mkdirSync("generated");
        }

        fs.writeFileSync(filePath, buffer);
        return { title: resume.title, path: filePath };
      })
    );
    res.render("resumeBuilder.ejs", {
      review : parsedResponse,
      files: generatedFiles.map(file => ({
        title: file.title,
        downloadUrl: `/downloadResume?file=${encodeURIComponent(file.path)}`
      }))
    })
    

                  } catch (err) {
                    console.error("❌ Error processing résumé:", err);
                    res.status(500).json({ error: "Failed to analyze résumé" });
                  }
                });
                
                app.get("/downloadResume", (req, res) => {
                  const fileParam = req.query.file;
                
                  if (!fileParam) {
                    return res.status(400).send("Missing file parameter.");
                  }
                
                  const filePath = path.resolve(__dirname, fileParam);
                
                  if (!fs.existsSync(filePath)) {
                    return res.status(404).send("File not found.");
                  }
                
                  res.download(filePath, (err) => {
                    if (err) {
                      console.error("Download error:", err);
                      res.status(500).send("Error downloading the file.");
                    }
                  });
                });

                

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

