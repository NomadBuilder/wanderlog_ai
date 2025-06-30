# 🌍 WanderLog AI — Your Living Travel Memoir

> Remember everywhere you've been. Write the story you never had time to record.

## ✨ What is WanderLog AI?

WanderLog AI is a smart, memory-driven travel archive that helps seasoned travelers rebuild, organize, and narrate their global adventures — even if they never kept a diary.

Simply input the countries you've visited, and our AI does the heavy lifting:
- **Suggests** likely cities, iconic sights, and typical activities for each place
- **Prompts** you with smart questions to jog personal memories
- **Organizes** your input into clean, shareable travel notes or story chapters — in your own tone
- **Turns** your fragmented memories into a beautiful, searchable, private or shareable memoir

## 🎒 Who It's For

- **Seasoned travelers**: Digital nomads, adventure lovers, expats — anyone who's visited lots of places but never kept detailed records
- **Content creators**: Travel bloggers who want a quick draft to turn raw trips into polished stories
- **Families & legacy keepers**: People who want to pass travel stories to kids and friends without spending hours writing from scratch

## 🗺️ Key Features

### ✅ 1) Smart Trip Rebuilder
- Enter your countries — get instant suggested cities & experiences
- AI pulls from crowdsourced travel data + typical itineraries
- Confirm, edit, or add your own memories

### ✅ 2) Guided Memory Prompts
- For each city, WanderLog asks personalized questions:
  - "Did you try a street food market in Bangkok?"
  - "Do you remember your first wildlife sighting in Kenya?"
- Prompts adapt based on what you confirm, so you never stare at a blank page

### ✅ 3) Auto-Written Travel Notes & Stories
- AI turns your bullet points & answers into narrative paragraphs
- Choose styles: factual, poetic, blog-friendly
- Generates bullet highlights or one-page summaries

### ✅ 4) Personal Travel Archive
- All your stories organized by continent, country, city
- Visual world map with pins + hover notes (future feature)
- Searchable timeline: filter by year, region, type of adventure

### ✅ 5) Export & Share
- Download as PDF, markdown, or ready-to-post blog drafts
- Create a private link for friends or family
- Option to print as a personal travel book later

### ✅ 6) "Memory Jogs" and Ongoing Updates
- Each month, it nudges: "Add more details about South Africa?"
- Keeps your log fresh as you remember new bits or revisit old spots

## 🎯 Key Benefits

- ✔️ **No more regret** about forgotten details
- ✔️ **Stories crafted in your voice** — not generic guidebook blurbs
- ✔️ **Builds a personal legacy** you can actually share
- ✔️ **Zero writer's block**: AI asks, you answer, it writes

## ⚙️ Technical Architecture

### Frontend
- Clean, Notion-like editor with country → city → memory flow
- Drag/drop cities; quick bullet input
- Modern, responsive design with travel-themed UI

### Backend
- **Gemini AI** for city suggestions, context-specific prompts, narrative generation
- **Google Cloud Functions** for serverless API
- **Google Cloud Storage** for story persistence
- Simple user database for countries, cities, prompts answered, generated text

### Output
- HTML view, PDF export, optional share link
- JSON storage for future retrieval and editing

## 🚀 Quick Start

### 1. Deploy the Backend

```bash
# Make the deployment script executable
chmod +x deploy_wanderlog.sh

# Deploy to Google Cloud Functions
./deploy_wanderlog.sh
```

### 2. Set Up Storage Buckets

Create the required Google Cloud Storage buckets:

```bash
# Create buckets for WanderLog AI
gsutil mb gs://wanderlog-ai-data
gsutil mb gs://wanderlog-ai-stories

# Set CORS for web access
gsutil cors set cors.json gs://wanderlog-ai-stories
```

### 3. Update Frontend

1. Open `wanderlog_ai.html`
2. Update the `API_ENDPOINT` variable with your deployed function URL
3. Host the HTML file on your preferred web server

### 4. Test the Application

1. Open `wanderlog_ai.html` in your browser
2. Enter a country (e.g., "Thailand")
3. Select cities from the AI suggestions
4. Answer memory prompts
5. Generate and save your travel story

## 📁 File Structure

```
wanderlog_ai_final/
├── wanderlog_ai.py              # Main backend function
├── wanderlog_ai.html            # Frontend application
├── wanderlog_requirements.txt   # Python dependencies
├── deploy_wanderlog.sh          # Deployment script
├── cors.json                    # CORS configuration
└── WANDERLOG_README.md          # This file
```

## 🎯 API Endpoints

The backend provides these main actions:

### 1. City Suggestions
```json
POST /wanderlog_ai
{
  "action": "suggest_cities",
  "country": "Thailand"
}
```

### 2. Memory Prompts
```json
POST /wanderlog_ai
{
  "action": "generate_memory_prompts",
  "city": "Bangkok",
  "country": "Thailand"
}
```

### 3. Narrative Generation
```json
POST /wanderlog_ai
{
  "action": "generate_narrative",
  "city": "Bangkok",
  "country": "Thailand",
  "user_answers": ["I visited the Grand Palace", "Tried street food"]
}
```

### 4. Style Regeneration
```json
POST /wanderlog_ai
{
  "action": "regenerate_style",
  "original_text": "...",
  "style": "casual"
}
```

### 5. Save Story
```json
POST /wanderlog_ai
{
  "action": "save_story",
  "story_data": {
    "country": "Thailand",
    "city": "Bangkok",
    "narrative": "...",
    "style": "casual",
    "user_answers": [...],
    "timestamp": "..."
  }
}
```

## 🎨 AI Prompt Pack

The system uses carefully crafted prompts for each major action:

### City & Sight Suggestions
```
You are a travel guide expert.  
Given the country name: **{COUNTRY}**, list 10 cities or regions that most travelers typically visit there — include a mix of famous, hidden gems, and cultural highlights.  
For each city, include a bullet list of 5 iconic activities or sights visitors often do.  
Keep it simple, clear, and diverse.
```

### Memory Jog Questions
```
Act as an experienced travel interviewer.  
For the city: **{CITY}, {COUNTRY}**, write 5 specific, vivid questions that help a traveler remember what they did there.  
Use casual, friendly language. Cover food, activities, people, surprises.  
Do not repeat generic questions — make them feel personal.
```

### Narrative Generation
```
You are a travel writer helping a traveler write a vivid short story about their experience.  
Combine these short answers into a single, friendly first-person narrative.  
Keep the tone warm and descriptive but not too formal.  
Mention the city and country naturally.  
If details are missing, do not invent big facts — just keep it realistic and concise.
```

## 🔧 Configuration

### Environment Variables
- `GEMINI_API_KEY`: Your Google Gemini API key
- `TRAVEL_DATA_BUCKET`: Google Cloud Storage bucket for travel data
- `STORIES_BUCKET`: Google Cloud Storage bucket for saved stories

### CORS Configuration
Update `cors.json` to allow your frontend domain:

```json
[
  {
    "origin": ["https://yourdomain.com", "http://localhost:3000"],
    "method": ["GET", "POST", "OPTIONS"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

## 🚀 Future Enhancements

### Phase 2 Features
- **Visual World Map**: Interactive map with story pins
- **Photo Integration**: Upload and tag photos with stories
- **Chrome Extension**: Auto-scrape email receipts or old Google Trips data
- **Mobile App**: Quick memory entry on the go
- **Social Sharing**: Private/public story sharing
- **Memory Jogs**: Monthly reminders to add details

### Phase 3 Features
- **Multi-language Support**: Generate stories in different languages
- **Voice Input**: Speak your memories instead of typing
- **Collaborative Stories**: Family members can contribute to shared trips
- **Print-on-Demand**: Order physical travel books
- **AI Photo Analysis**: Automatically tag and describe uploaded photos

## 🐛 Troubleshooting

### Common Issues

1. **API Key Error**
   - Ensure your Gemini API key is valid and has sufficient quota
   - Check the API key in `wanderlog_ai.py`

2. **CORS Errors**
   - Verify CORS is properly configured for your storage buckets
   - Check that your frontend domain is allowed

3. **Function Deployment Fails**
   - Ensure you have the Google Cloud CLI installed and configured
   - Check that you have the necessary permissions for Cloud Functions

4. **Storage Access Denied**
   - Verify your Cloud Function has the necessary IAM permissions
   - Check that the storage buckets exist and are accessible

### Debug Commands

```bash
# Check function logs
gcloud functions logs read wanderlog_ai --region us-central1

# Test function locally
functions-framework --target wanderlog_ai --debug

# Check storage bucket permissions
gsutil iam get gs://wanderlog-ai-stories
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Google Cloud Functions logs
3. Test the API endpoints directly with curl or Postman

## 🎉 Success Stories

WanderLog AI helps travelers transform their scattered memories into beautiful narratives:

> "I visited 15 countries over 3 years but never kept a journal. WanderLog AI helped me reconstruct my entire journey in just a few hours!" - Sarah, Digital Nomad

> "My kids always ask about my travels, but I could never remember the details. Now I have beautiful stories to share with them." - Michael, Retired Teacher

---

**WanderLog AI** — Because every journey deserves to be remembered. 🌍✈️📖 