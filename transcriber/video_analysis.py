import cv2
import mediapipe as mp
import numpy as np
import os
import urllib.request
from typing import Dict, Any, List

class VideoAnalyzer:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), "face_landmarker.task")
        self._ensure_model_exists()
        
        BaseOptions = mp.tasks.BaseOptions
        FaceLandmarker = mp.tasks.vision.FaceLandmarker
        FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
        VisionRunningMode = mp.tasks.vision.RunningMode

        self.options = FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=self.model_path),
            running_mode=VisionRunningMode.VIDEO,
            output_face_blendshapes=True,
            num_faces=1
        )
        self.landmarker = FaceLandmarker.create_from_options(self.options)

    def _ensure_model_exists(self):
        if not os.path.exists(self.model_path):
            print(f"Downloading MediaPipe face landmarker model to {self.model_path}...")
            url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
            urllib.request.urlretrieve(url, self.model_path)
            print("Download complete.")

    def analyze(self, video_path: str) -> Dict[str, Any]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"error": "Could not open video file"}

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        frame_count = 0
        face_detected_count = 0
        looking_at_camera_count = 0
        smiling_count = 0
        
        # Sampling rate: process every 5th frame to speed up
        skip_frames = 5
        
        try:
            while cap.isOpened():
                success, image = cap.read()
                if not success:
                    break
                
                frame_count += 1
                if frame_count % skip_frames != 0:
                    continue

                # Convert the BGR image to RGB.
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
                
                # Timestamp in milliseconds
                frame_timestamp_ms = int((frame_count / fps) * 1000)
                
                result = self.landmarker.detect_for_video(mp_image, frame_timestamp_ms)

                if result.face_landmarks:
                    face_detected_count += 1
                    # result.face_landmarks is a list of lists of NormalizedLandmark
                    face_landmarks = result.face_landmarks[0]
                    
                    if self._is_looking_at_camera(face_landmarks, image.shape):
                        looking_at_camera_count += 1
                    
                    if result.face_blendshapes:
                        # Blendshape 44 and 45 are usually smile related (mouthSmileLeft, mouthSmileRight)
                        # We can also check 25 (mouthStretchLeft) etc.
                        # Index 44: mouthSmileLeft, Index 45: mouthSmileRight
                        blendshapes = result.face_blendshapes[0]
                        smile_score = 0
                        for b in blendshapes:
                            if b.category_name in ['mouthSmileLeft', 'mouthSmileRight']:
                                smile_score += b.score
                        if smile_score > 0.6: # Average of 0.3 per side
                            smiling_count += 1
        finally:
            cap.release()
        
        analyzed_frames = frame_count // skip_frames
        if analyzed_frames == 0:
            return {
                "face_presence_score": 0.0,
                "eye_contact_score": 0.0,
                "smile_score": 0.0,
                "analyzed_frames": 0
            }

        return {
            "face_presence_score": round(face_detected_count / analyzed_frames, 2),
            "eye_contact_score": round(looking_at_camera_count / analyzed_frames, 2),
            "smile_score": round(smiling_count / analyzed_frames, 2),
            "analyzed_frames": analyzed_frames
        }

    def _is_looking_at_camera(self, landmarks, image_shape):
        h, w, _ = image_shape
        face_3d = []
        face_2d = []

        # Key landmarks for head pose estimation in Tasks API
        # The indices might differ slightly from legacy Mesh but usually mapping is similar.
        # Legacy indices: [1, 152, 33, 263, 61, 291]
        # Nose tip, Chin, Left eye left corner, Right eye right corner, Left mouth corner, Right mouth corner
        key_indices = [1, 152, 33, 263, 61, 291]
        
        for idx in key_indices:
            lm = landmarks[idx]
            x, y = int(lm.x * w), int(lm.y * h)
            face_2d.append([x, y])
            # Use z as provided by MediaPipe
            face_3d.append([x, y, lm.z * w]) # scale Z by width for approximate units

        face_2d = np.array(face_2d, dtype=np.float64)
        face_3d = np.array(face_3d, dtype=np.float64)

        # Camera matrix (approximate)
        focal_length = 1 * w
        cam_matrix = np.array([[focal_length, 0, w / 2],
                               [0, focal_length, h / 2],
                               [0, 0, 1]])

        dist_matrix = np.zeros((4, 1), dtype=np.float64)
        success, rot_vec, trans_vec = cv2.solvePnP(face_3d, face_2d, cam_matrix, dist_matrix)

        if not success:
            return False

        rmat, _ = cv2.Rodrigues(rot_vec)
        angles, _, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)

        x = angles[0] * 360
        y = angles[1] * 360
        
        # Thresholds for "looking at camera"
        if y < -12 or y > 12: return False
        if x < -12 or x > 12: return False
        
        return True
