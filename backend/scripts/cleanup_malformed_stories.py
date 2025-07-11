import os
import json
import sys

# === Local Storage Cleanup ===
LOCAL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'stories')
MALFORMED_COUNTRY_VALUES = {'', 'undefined', 'none', 'null'}

def is_malformed(story):
    country = story.get('country')
    if country is None:
        return True
    country_str = str(country).strip().lower()
    return country_str in MALFORMED_COUNTRY_VALUES

def cleanup_local():
    print(f"\n🧹 Cleaning up local stories in {LOCAL_DIR}...")
    deleted = 0
    for fname in os.listdir(LOCAL_DIR):
        if fname.endswith('.json'):
            fpath = os.path.join(LOCAL_DIR, fname)
            try:
                with open(fpath, 'r') as f:
                    data = json.load(f)
                if is_malformed(data):
                    os.remove(fpath)
                    print(f"  🗑️ Deleted malformed: {fname}")
                    deleted += 1
            except Exception as e:
                print(f"  ⚠️ Error reading {fname}: {e}")
    print(f"✅ Local cleanup complete. Deleted {deleted} files.")

# === Google Cloud Storage Cleanup ===
def cleanup_gcs():
    try:
        from google.cloud import storage
    except ImportError:
        print("\n⚠️ google-cloud-storage not installed. Skipping GCS cleanup.")
        return
    BUCKET_NAME = 'wanderlog-ai-stories'
    print(f"\n🧹 Cleaning up Google Cloud Storage bucket: {BUCKET_NAME} ...")
    try:
        client = storage.Client()
        bucket = client.bucket(BUCKET_NAME)
        blobs = list(bucket.list_blobs(prefix='stories/'))
        deleted = 0
        for blob in blobs:
            if blob.name.endswith('.json'):
                try:
                    content = blob.download_as_text()
                    data = json.loads(content)
                    if is_malformed(data):
                        blob.delete()
                        print(f"  🗑️ Deleted malformed: {blob.name}")
                        deleted += 1
                except Exception as e:
                    print(f"  ⚠️ Error reading {blob.name}: {e}")
        print(f"✅ GCS cleanup complete. Deleted {deleted} blobs.")
    except Exception as e:
        print(f"⚠️ Could not access GCS bucket: {e}")

if __name__ == '__main__':
    cleanup_local()
    cleanup_gcs()
    print("\n🎉 Cleanup finished.") 