#!/bin/bash

echo "🚀 Deploying WanderLog AI to Google Cloud Functions..."

# Deploy the main WanderLog AI function
echo "📦 Deploying wanderlog_ai function..."
gcloud functions deploy wanderlog_ai \
  --runtime python310 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --source . \
  --entry-point wanderlog_ai

echo "✅ WanderLog AI deployed successfully!"
echo ""
echo "🌐 Your API endpoint:"
echo "https://us-central1-basic-zenith-358318.cloudfunctions.net/wanderlog_ai"
echo ""
echo "📝 Update the API_ENDPOINT in wanderlog_ai.html with the URL above"
echo ""
echo "🎉 WanderLog AI is ready to help travelers create their memoirs!"
echo ""
echo "📚 Next steps:"
echo "1. Create storage buckets: gsutil mb gs://wanderlog-ai-data gs://wanderlog-ai-stories"
echo "2. Set CORS: gsutil cors set cors.json gs://wanderlog-ai-stories"
echo "3. Test the app: open wanderlog_ai.html in your browser" 