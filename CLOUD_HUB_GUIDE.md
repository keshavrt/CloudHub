# CloudHub: Event & Media Management Platform
## User Guide & Project Walkthrough

Welcome to CloudHub, a modern web application designed to simplify event planning and streamline digital asset management. This guide outlines the key features of the platform, the role-based access rules, and a detailed walkthrough showing how to test social features and notifications by switching accounts.

---

## 1. Key Features Overview

CloudHub includes eight core modules built to solve real-world media management challenges:

### 📅 Event & Album Management
*   **Create Events**: Organizers can create events with details like Name, Description, Location, and Date.
*   **Event-Wise Albums**: Group photos inside specific event folders or albums (e.g., "General", "Main Stage", "Behind the Scenes").
*   **Smart Sorting**: Sort the events page dynamically by Name, Date, or Category to locate albums instantly.

### 📤 Drag-and-Drop Media Upload System
*   **Drag-and-Drop**: Seamlessly drag files from your computer and drop them into the upload panel.
*   **Bulk Uploads**: Upload multiple photos and videos simultaneously to save time.
*   **Media Previews**: Inspect thumbnails of your files inside the uploader before confirming the upload.
*   **Cloud Storage**: Files are securely stored and optimized in cloud storage bucket containers.

### 🔑 Access Control & Role-Based Security
The system maintains strict boundaries to protect media assets:
*   **Public Media**: Openly accessible to all users for viewing and downloading.
*   **Private Media**: Restricted content only visible to authorized club members.
*   **User Roles**:
    *   **Admin**: Full system control, manages events, and accesses the User Management Portal to promote/demote user roles and assign club affiliations *(Admin portal not covered in the demo video)*.
    *   **Photographer**: Authorized to create events, add albums, and upload media.
    *   **Club Member**: Can view private club events, interact, and register face profiles.
    *   **Viewer**: Guests who can view public event albums and download files.

### 👥 Admin User Management Portal (Not covered in Demo Video)
*   **Admin Console**: Admins have access to a dedicated User Management dashboard (accessible via the "Admin Panel" link in the top navigation bar). 
    *   *Note: This feature is fully functional on the platform but was not shown in the recording of the product demo video.*
*   **Role Promotions & Demotions**: Admins can dynamically upgrade or downgrade any registered user's role (e.g., promoting a Viewer to a Photographer or Club Member).
*   **Club Affiliation**: Admins can assign and update organizing club names for specific users directly from the console.

### 💬 Social & Interactive Features
*   **Engagement**: Users can Like and Comment on event photos in real-time.
*   **Favorites**: Add photos to your personal "Favorites" drawer on the dashboard.
*   **Sharing**: Direct click-to-copy links make sharing photos to social media simple.
*   **Real-time Notifications**: Receive instant visual alerts when:
    *   Someone likes your photo.
    *   Someone comments on your upload.
    *   You are automatically spotted/tagged in a photo.

### 🧠 AI Image Tagging & Face Recognition
*   **Smart Image Tagging**: When an image is uploaded, an integrated AI analysis engine automatically generates relevant tags (e.g., crowd, dining, keynote, celebration).
*   **Advanced Search**: Search the gallery by event name, specific tags, upload date, or photographer.
*   **Selfie Matching Feed**:
    1.  Upload a reference selfie to your Profile.
    2.  The system scans the database for your face.
    3.  All matched photos are automatically placed in your personalized **"My Photos"** feed.

### 💧 Dynamic Watermarking System
*   **Asset Protection**: When you download a photo, the platform dynamically overlays a clean watermark.
*   **Context-Aware Watermark**: The watermark automatically displays the Club Name, Event Name, and your User Role on the bottom of the image.

---

## 2. Walkthrough: Testing Social Interactions & Account Switching

To see the social features, notifications, and role-based permissions working dynamically, follow this step-by-step account switching flow:

### Step 1: Upload a Photo (As the Photographer/Admin)
1.  Log in to the platform using a Photographer or Admin account.
2.  Go to the **Events** tab, select an event, and click the **Upload** panel.
3.  Drag and drop a photo (e.g., name it `event_face_john.jpg` to test face matching later).
4.  Click **Upload**. The image is uploaded to cloud storage and is registered under your account.
5.  Click **Log Out** (note the clean, automatic redirection back to the login screen).

### Step 2: Like, Comment, and Register Selfie (As a Club Member)
1.  Log in to the platform using a different account (e.g., a Club Member like John).
2.  Go to the **Events** page and open the photo uploaded in Step 1.
3.  Click the **Like ❤️** button to toggle a like.
4.  Open the comment section, type a message (e.g., `"Amazing shot!"`), and click **Post**.
5.  Go to your **Profile** page and upload your reference selfie. This registers your face template and triggers a silent, retroactive database scan.
6.  Click **Log Out** to return to the sign-in screen.

### Step 3: Check Notifications & Matching (Back as Photographer/Admin)
1.  Log in back as the Photographer/Admin who uploaded the original photo.
2.  Look at the bell icon **🔔** in the top-right corner of the screen.
3.  You will see new notifications:
    *   *"John liked your photo"*
    *   *"John commented on your upload: 'Amazing shot!'"*
4.  Click **Log Out**.

### Step 4: Verify Face Spotting (Back as the Club Member)
1.  Log in back as the Club Member (John).
2.  Look at your notification bell. You will see a notification:
    *   *"You were spotted and tagged in a new event photo!"*
3.  Go to the **My Photos** tab. You will see the image `event_face_john.jpg` matching your reference selfie displayed in your personalized gallery!
4.  Click the photo and click **Download** to see your dynamic watermark (e.g. `Member - Tech Conference`) embedded at the bottom.

### Step 5: Verify Admin User Management (Not covered in Demo Video)
*Note: This administrative control console is a core feature of CloudHub but was not demonstrated in the video.*
1.  Log in back as the Admin (`admin@eventmanager.com`).
2.  Click on the **Admin Panel** link in the top navigation bar.
3.  You will see a list of all registered users on the platform.
4.  Locate any user (e.g., John or a test user), change their role (e.g., from Viewer to Photographer), and update their organizing club name.
5.  Click **Save**. The role and club updates take effect instantly across the database, shifting permissions on their next action.
