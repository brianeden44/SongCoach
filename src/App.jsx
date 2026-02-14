import React, { useState, useRef } from "react";
import {
  Upload,
  Mic,
  Music,
  Heart,
  Sparkles,
  Star,
  CheckCircle,
  ArrowRight,
  Loader,
  StopCircle,
} from "lucide-react";

export default function SongCoachApp() {
  const [currentView, setCurrentView] = useState("homepage");
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    songTitle: "",
    musical: "",
    goal: "",
  });
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const colors = {
    skyBlue: "#87CEEB",
    blushPink: "#FFB6C1",
    lightBlue: "#B0E0E6",
    paleRose: "#FFE4E1",
    cream: "#FFFEF7",
  };

  // Audio analysis functions
  const analyzeAudioFeatures = (audioBuffer) => {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    return {
      duration: duration.toFixed(1),
      avgVolume: calculateAverageVolume(channelData),
      volumeVariation: calculateVolumeVariation(channelData),
      pitchStability: calculatePitchStability(channelData, sampleRate),
      rhythmConsistency: calculateRhythmConsistency(channelData, sampleRate),
    };
  };

  const calculateAverageVolume = (data) => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
    return ((sum / data.length) * 100).toFixed(1);
  };

  const calculateVolumeVariation = (data) => {
    const windowSize = 4410;
    const volumes = [];
    for (let i = 0; i < data.length; i += windowSize) {
      let sum = 0;
      const end = Math.min(i + windowSize, data.length);
      for (let j = i; j < end; j++) sum += Math.abs(data[j]);
      volumes.push(sum / windowSize);
    }
    const avg = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance =
      volumes.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
      volumes.length;
    return Math.sqrt(variance).toFixed(3);
  };

  const calculatePitchStability = (data, sampleRate) => {
    const windowSize = Math.floor(sampleRate * 0.1);
    let stability = 0;
    for (let i = 0; i < data.length - windowSize; i += windowSize) {
      const window = data.slice(i, i + windowSize);
      if (countZeroCrossings(window) > 0) stability++;
    }
    return ((stability / (data.length / windowSize)) * 100).toFixed(1);
  };

  const calculateRhythmConsistency = (data, sampleRate) => {
    const windowSize = Math.floor(sampleRate * 0.5);
    const energies = [];
    for (let i = 0; i < data.length; i += windowSize) {
      let energy = 0;
      const end = Math.min(i + windowSize, data.length);
      for (let j = i; j < end; j++) energy += data[j] * data[j];
      energies.push(energy);
    }
    const avg = energies.reduce((a, b) => a + b, 0) / energies.length;
    const variance =
      energies.reduce((sum, e) => sum + Math.pow(e - avg, 2), 0) /
      energies.length;
    return ((1 / (1 + variance)) * 100).toFixed(1);
  };

  const countZeroCrossings = (data) => {
    let crossings = 0;
    for (let i = 1; i < data.length; i++) {
      if (
        (data[i - 1] >= 0 && data[i] < 0) ||
        (data[i - 1] < 0 && data[i] >= 0)
      )
        crossings++;
    }
    return crossings;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) =>
        audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioFile(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        setCurrentView("form");
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError(
        "Could not access microphone. Please check your browser settings.",
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
        setError("Please upload an audio or video file!");
        return;
      }
      setAudioFile(file);
      setError(null);
      setCurrentView("form");
    }
  };

  const analyzeSinging = async () => {
    if (!audioFile || !formData.age || !formData.songTitle || !formData.goal) {
      setError("Please fill out all required fields!");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setCurrentView("analyzing");
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const analysis = analyzeAudioFeatures(audioBuffer);
      const feedbackText = await generateFeedback(analysis, formData);
      setFeedback({ raw: feedbackText });
      setCurrentView("feedback");
    } catch (err) {
      setError("Something went wrong. Please try again!");
      setCurrentView("form");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateFeedback = async (analysis, form) => {
    const nameInstruction = form.name
      ? `The child's name is ${form.name}. Use their name naturally throughout.`
      : "Address warmly without a specific name.";
    const prompt = `You are a warm, encouraging musical theater vocal coach giving feedback to a ${form.age}-year-old who sang "${form.songTitle}"${form.musical ? ` from ${form.musical}` : ""}. Goal: ${form.goal}.

${nameInstruction}

Audio: ${analysis.duration}s, Volume: ${analysis.avgVolume}%, Variation: ${analysis.volumeVariation}, Stability: ${analysis.pitchStability}%, Rhythm: ${analysis.rhythmConsistency}%

CRITICAL REQUIREMENTS:
1. ALWAYS write 3 detailed strengths (2-3 sentences each)
2. ALWAYS write 2 detailed improvements with exercises (2-3 sentences each)
3. ALWAYS include 4-5 item practice checklist
4. Use "${form.songTitle}" throughout
5. ${form.name ? `Use ${form.name}'s name naturally` : 'Use "you"'}
6. BE SPECIFIC about the audio
7. BE DETAILED (2-3 sentences minimum per point)
8. BE PLAYFUL with fun imagery

Style: enthusiastic theater teacher, vivid imagery ("like a superhero," "smelling cookies"), physical exercises, reference song/character, age-appropriate

Format EXACTLY:

STRENGTHS (3):
- ${form.name ? form.name + ", your" : "Your"} [2-3 sentences about what was great, reference "${form.songTitle}"]
- [2-3 sentences, specific to performance]
- [2-3 sentences, connect to ${form.goal}]

IMPROVEMENTS (2):

**[Playful Title]**
[2-3 sentences: what you noticed, how it affects singing, reference "${form.songTitle}"]
EXERCISE: [2-3 sentences: fun, physical, specific steps, vivid imagery]

**[Second Title]**  
[2-3 sentences about the issue]
EXERCISE: [2-3 sentences: creative, clear, exciting]

PRACTICE_CHECKLIST (4-5):
- [Task with numbers/frequency]
- [Task with numbers/frequency]
- [Fun challenge with "${form.songTitle}"]
- [Recording/listening task]
- [Encouraging close ${form.name ? "with " + form.name : ""}]`;

    try {
    const response = await fetch('/api/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    childName: formData.childName,
    age: formData.age,
    songTitle: formData.songTitle,
    goal: formData.goal,
    transcript: `${formData.childName} sang ${formData.songTitle}. This is a test recording for practice.`
  })
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || 'Failed to get feedback');
}

return data.feedback;
    } catch (err) {
      console.error("Fetch error:", err);
      return getFallbackFeedback(form);
    }
  };

  const parseFeedback = (text, form) => {
    const sections = { strengths: [], improvements: [], checklist: [] };
    try {
      const strengthsMatch = text.match(
        /STRENGTHS.*?:([\s\S]*?)(?=IMPROVEMENTS|$)/i,
      );
      if (strengthsMatch) {
        sections.strengths = strengthsMatch[1]
          .trim()
          .split(/\n+/)
          .map((s) => s.replace(/^[-•*\d.]\s*/, "").trim())
          .filter((s) => s && s.length > 10);
      }
      const improvementsMatch = text.match(
        /IMPROVEMENTS.*?:([\s\S]*?)(?=PRACTICE_CHECKLIST|$)/i,
      );
      if (improvementsMatch) {
        improvementsMatch[1].split(/\n\n+/).forEach((block) => {
          const lines = block
            .trim()
            .split("\n")
            .filter((l) => l.trim());
          if (lines.length >= 1) {
            const title = lines[0].replace(/^[-•*\d.]\s*/, "").trim();
            let explanation = "",
              exercise = "";
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line.toUpperCase().startsWith("EXERCISE:")) {
                exercise = line.replace(/^EXERCISE:\s*/i, "").trim();
              } else if (!exercise) {
                explanation += (explanation ? " " : "") + line;
              }
            }
            if (title && title.length > 5) {
              sections.improvements.push({ title, explanation, exercise });
            }
          }
        });
      }
      const checklistMatch = text.match(/PRACTICE_CHECKLIST.*?:([\s\S]*?)$/i);
      if (checklistMatch) {
        sections.checklist = checklistMatch[1]
          .trim()
          .split(/\n+/)
          .map((s) => s.replace(/^[-•*\d.]\s*/, "").trim())
          .filter((s) => s && s.length > 5);
      }
      if (
        sections.strengths.length === 0 &&
        sections.improvements.length === 0
      ) {
        return getFallbackFeedback(form);
      }
    } catch (err) {
      return getFallbackFeedback(form);
    }
    return sections;
  };

  const getFallbackFeedback = (form) => ({
    strengths: [
      `${form.name ? form.name + ", you" : "You"} showed courage singing "${form.songTitle}"! That bravery is the first step to becoming great.`,
      `${form.name ? form.name + ", your" : "Your"} enthusiasm came through clearly. Keep that love for music!`,
      `You completed the whole song without stopping, which shows real dedication!`,
    ],
    improvements: [
      {
        title: "Building Vocal Strength",
        explanation: `Let's work on breath support for "${form.songTitle}" - it helps you sing with more power!`,
        exercise: `Stand tall like a superhero! Hands on belly, HUGE breath (like smelling cookies). Sing your favorite line from "${form.songTitle}" LOUD while pushing gently with your belly. Try 3 times!`,
      },
      {
        title: "Matching the Music's Rhythm",
        explanation: `Practicing with "${form.songTitle}" recording helps you match the beat perfectly!`,
        exercise: `Clap along to "${form.songTitle}" on every important word. Then sing while imagining you're clapping in your mind!`,
      },
    ],
    checklist: [
      "Practice superhero breathing 5 times daily",
      `Clap along to "${form.songTitle}" three times`,
      form.name
        ? `${form.name}, sing louder each time!`
        : "Sing louder each time!",
      `Record "${form.songTitle}" again and listen`,
      form.name ? `Keep rocking, ${form.name}! 🎵` : "Keep practicing! 🎵",
    ],
  });

  const startOver = () => {
    setCurrentView("home");
    setFormData({ name: "", age: "", songTitle: "", musical: "", goal: "" });
    setAudioFile(null);
    setFeedback(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Quicksand:wght@400;600;700&family=Caveat:wght@400;700&display=swap');
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .feature-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .feature-card:hover { transform: translateY(-5px); box-shadow: 0 25px 70px rgba(0, 0, 0, 0.12); }
  `;

  // HOMEPAGE
  if (currentView === "homepage") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.paleRose} 50%, ${colors.lightBlue} 100%)`,
          fontFamily: '"Quicksand", sans-serif',
        }}
      >
        <style>{styles}</style>
        <div
          style={{
            padding: "4rem 2rem",
            textAlign: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              marginBottom: "2rem",
              opacity: 0,
              animation: "scaleIn 0.8s ease-out 0.2s forwards",
            }}
          >
            <img
              src="/hazel-logo-transparent.png"
              alt="SongCoach Logo"
              style={{
                width: "400px",
                maxWidth: "90%",
                height: "auto",
                marginBottom: "1rem",
                filter: "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.1))",
              }}
            />
          </div>
          <div
            style={{
              opacity: 0,
              animation: "fadeInUp 0.8s ease-out 0.4s forwards",
            }}
          >
            <h2
              style={{
                fontSize: "2.5rem",
                color: "#333",
                fontWeight: "600",
                marginBottom: "1.5rem",
                lineHeight: "1.3",
              }}
            >
              Your Personal Singing Coach,
              <br />
              Anytime You Need It
            </h2>
            <p
              style={{
                fontSize: "1.3rem",
                color: "#555",
                maxWidth: "700px",
                margin: "0 auto 3rem auto",
                lineHeight: "1.7",
              }}
            >
              Get kind, honest, detailed feedback on your singing from an AI
              coach — just like having a supportive musical theater teacher
              cheering you on!
            </p>
            <button
              onClick={() => setCurrentView("home")}
              style={{
                padding: "1.5rem 3rem",
                fontSize: "1.4rem",
                fontWeight: "600",
                color: "white",
                background: `linear-gradient(135deg, ${colors.skyBlue} 0%, ${colors.blushPink} 100%)`,
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                boxShadow: "0 8px 30px rgba(135, 206, 235, 0.4)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.8rem",
                transition: "all 0.3s ease",
                fontFamily: "inherit",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-3px) scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 12px 40px rgba(135, 206, 235, 0.5)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(135, 206, 235, 0.4)";
              }}
            >
              Try SongCoach Free <ArrowRight size={24} />
            </button>
          </div>
        </div>

        {/* How It Works */}
        <div
          style={{
            padding: "4rem 2rem",
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                color: "#333",
                textAlign: "center",
                marginBottom: "3rem",
                fontWeight: "600",
              }}
            >
              How It Works
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "2rem",
              }}
            >
              {[
                {
                  icon: <Upload size={36} color="white" />,
                  bg: `linear-gradient(135deg, ${colors.lightBlue} 0%, ${colors.skyBlue} 100%)`,
                  title: "1. Record or Upload",
                  text: "Sing your favorite song and upload it, or record directly in the app",
                },
                {
                  icon: <Sparkles size={36} color="white" />,
                  bg: `linear-gradient(135deg, ${colors.paleRose} 0%, ${colors.blushPink} 100%)`,
                  title: "2. AI Coach Listens",
                  text: "Our AI listens and generates personalized coaching feedback, like a real voice teacher",
                },
                {
                  icon: <Star size={36} color="white" fill="white" />,
                  bg: `linear-gradient(135deg, ${colors.skyBlue} 0%, ${colors.blushPink} 100%)`,
                  title: "3. Get Personal Feedback",
                  text: "Receive detailed, encouraging feedback with fun exercises to try",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="feature-card"
                  style={{
                    background: "white",
                    padding: "2.5rem 2rem",
                    borderRadius: "25px",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: step.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 1.5rem auto",
                    }}
                  >
                    {step.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      color: "#333",
                      marginBottom: "1rem",
                      fontWeight: "600",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "1.1rem",
                      color: "#666",
                      lineHeight: "1.6",
                    }}
                  >
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What Makes It Special */}
        <div
          style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto" }}
        >
          <h2
            style={{
              fontSize: "2.5rem",
              color: "#333",
              textAlign: "center",
              marginBottom: "1rem",
              fontWeight: "600",
            }}
          >
            What Makes SongCoach Special?
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              color: "#666",
              textAlign: "center",
              maxWidth: "700px",
              margin: "0 auto 3rem auto",
              lineHeight: "1.6",
            }}
          >
            SongCoach gives you thoughtful, personalized coaching feedback —
            like having a supportive voice teacher available anytime you need
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
            }}
          >
            {[
              {
                icon: (
                  <Heart
                    size={28}
                    stroke={colors.blushPink}
                    fill={colors.blushPink}
                  />
                ),
                title: "Kind & Honest",
                text: "Encouraging feedback that celebrates strengths while giving clear, actionable suggestions",
              },
              {
                icon: <Music size={28} stroke={colors.skyBlue} />,
                title: "Detailed & Specific",
                text: "Every response includes what you did well, areas to improve, fun practice exercises, and a personalized checklist",
              },
              {
                icon: (
                  <Sparkles
                    size={28}
                    stroke={colors.blushPink}
                    fill={colors.blushPink}
                  />
                ),
                title: "Musical Theater Style",
                text: "Feedback in the voice of a warm, enthusiastic theater coach who genuinely wants you to shine",
              },
              {
                icon: <CheckCircle size={28} stroke={colors.skyBlue} />,
                title: "Age-Appropriate",
                text: "Tailored to your age and experience, with playful language that makes practice fun",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="feature-card"
                style={{
                  background: "white",
                  padding: "2rem",
                  borderRadius: "20px",
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
                }}
              >
                <div style={{ marginBottom: "1rem" }}>{f.icon}</div>
                <h3
                  style={{
                    fontSize: "1.4rem",
                    color: "#333",
                    marginBottom: "0.8rem",
                    fontWeight: "600",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: "1.05rem",
                    color: "#666",
                    lineHeight: "1.6",
                  }}
                >
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Made by Hazel */}
        <div
          style={{
            padding: "4rem 2rem",
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "2.5rem",
                color: "#333",
                textAlign: "center",
                marginBottom: "1rem",
                fontWeight: "600",
              }}
            >
              Made by a Singer, For Singers
            </h2>
            <p
              style={{
                fontSize: "1.2rem",
                color: "#666",
                textAlign: "center",
                marginBottom: "3rem",
                lineHeight: "1.6",
              }}
            >
              SongCoach was created by Hazel, a 10-year-old actor and singer
            </p>
            <div
              style={{
                background: "white",
                borderRadius: "25px",
                padding: "2.5rem",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2.5rem",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
                }}
              >
                <img
                  src="/hazel-photo.jpg"
                  alt="Hazel, creator of SongCoach"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <div>
                <div
                  style={{
                    display: "inline-block",
                    background: `linear-gradient(135deg, ${colors.skyBlue}20 0%, ${colors.blushPink}20 100%)`,
                    padding: "0.5rem 1.5rem",
                    borderRadius: "20px",
                    marginBottom: "1.5rem",
                  }}
                >
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      color: colors.skyBlue,
                      margin: "0",
                    }}
                  >
                    FROM HAZEL
                  </p>
                </div>
                <p
                  style={{
                    fontSize: "1.2rem",
                    color: "#333",
                    lineHeight: "1.8",
                    marginBottom: "1.5rem",
                    fontStyle: "italic",
                  }}
                >
                  "My name is Hazel and I am 10 years old and I made this
                  because I am an actor and LOVE to sing and I know from
                  personal experience that some people give feedback based on
                  what you want to hear instead of how you did! I wanted an app
                  that could give honest feedback on my singing to help improve
                  and give me confidence in my work. I hope this app is helpful
                  for you too!!!!!!!!! :]"
                </p>
                <div
                  style={{
                    padding: "1.5rem",
                    background: `linear-gradient(135deg, ${colors.lightBlue}15 0%, ${colors.skyBlue}10 100%)`,
                    borderRadius: "15px",
                    border: `2px solid ${colors.skyBlue}30`,
                  }}
                >
                  <p
                    style={{
                      fontSize: "1.05rem",
                      color: "#555",
                      margin: "0",
                      lineHeight: "1.6",
                    }}
                  >
                    <strong style={{ color: colors.skyBlue }}>
                      Why it matters:
                    </strong>{" "}
                    Hazel understands what young singers need because she's one
                    too! She wanted feedback that's honest and helpful, not just
                    nice — and that's exactly what SongCoach delivers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            padding: "5rem 2rem",
            textAlign: "center",
            background: `linear-gradient(135deg, ${colors.skyBlue}20 0%, ${colors.blushPink}20 100%)`,
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "3rem",
                color: "#333",
                marginBottom: "1.5rem",
                fontWeight: "700",
              }}
            >
              Ready to Improve Your Singing?
            </h2>
            <p
              style={{
                fontSize: "1.3rem",
                color: "#555",
                marginBottom: "2.5rem",
                lineHeight: "1.7",
              }}
            >
              Get personalized, encouraging coaching feedback in seconds. No
              sign-up required to try!
            </p>
            <button
              onClick={() => setCurrentView("home")}
              style={{
                padding: "1.5rem 3.5rem",
                fontSize: "1.5rem",
                fontWeight: "600",
                color: "white",
                background: `linear-gradient(135deg, ${colors.skyBlue} 0%, ${colors.blushPink} 100%)`,
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                boxShadow: "0 10px 35px rgba(135, 206, 235, 0.5)",
                display: "inline-flex",
                alignItems: "center",
                gap: "1rem",
                transition: "all 0.3s ease",
                fontFamily: "inherit",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-3px) scale(1.03)";
                e.currentTarget.style.boxShadow =
                  "0 15px 45px rgba(135, 206, 235, 0.6)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 10px 35px rgba(135, 206, 235, 0.5)";
              }}
            >
              Try SongCoach Now <Mic size={28} />
            </button>
            <p
              style={{
                fontSize: "1rem",
                color: "#888",
                marginTop: "1.5rem",
                fontStyle: "italic",
              }}
            >
              Free to try • No credit card needed • Safe & private
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.5)",
            borderTop: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <p
            style={{
              fontSize: "1.2rem",
              color: "#888",
              margin: "0",
              fontFamily: '"Caveat", cursive',
            }}
          >
            Made with ❤️ by Hazel, age 10
          </p>
        </div>
      </div>
    );
  }

  // TOOL HOME SCREEN
  if (currentView === "home") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.paleRose} 50%, ${colors.lightBlue} 100%)`,
          padding: "2rem",
          fontFamily: '"Quicksand", sans-serif',
        }}
      >
        <style>{styles}</style>
        <div
          style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}
        >
          <div
            style={{ marginBottom: "3rem", animation: "fadeIn 1s ease-out" }}
          >
            <img
              src="/hazel-logo-transparent.png"
              alt="SongCoach"
              style={{
                width: "300px",
                maxWidth: "80%",
                height: "auto",
                marginBottom: "1.5rem",
                filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))",
              }}
            />
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "30px",
              padding: "3rem 2rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
              border: "3px solid rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(10px)",
            }}
          >
            <h2
              style={{
                fontSize: "2rem",
                color: "#333",
                marginBottom: "1rem",
                fontWeight: "600",
              }}
            >
              Ready to sing? 🎤
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                color: "#666",
                marginBottom: "2.5rem",
                lineHeight: "1.6",
              }}
            >
              Upload a recording or sing right now, and I'll give you kind,
              honest feedback to help you improve!
            </p>
            {error && (
              <div
                style={{
                  padding: "1rem",
                  background: "#FFF0F0",
                  border: "2px solid #FFB6C1",
                  borderRadius: "15px",
                  color: "#D8000C",
                  marginBottom: "1.5rem",
                  fontSize: "0.95rem",
                  lineHeight: "1.5",
                }}
              >
                {error}
              </div>
            )}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <label
                style={{
                  padding: "1.5rem",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  color: "white",
                  background: `linear-gradient(135deg, ${colors.skyBlue} 0%, #5FA8D3 100%)`,
                  borderRadius: "20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.8rem",
                  boxShadow: `0 6px 20px rgba(135, 206, 235, 0.4)`,
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 8px 25px rgba(135, 206, 235, 0.5)`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = `0 6px 20px rgba(135, 206, 235, 0.4)`;
                }}
              >
                <Upload size={24} />
                Upload a Recording
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  style={{
                    padding: "1.5rem",
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "white",
                    background: `linear-gradient(135deg, ${colors.blushPink} 0%, #FF8FA3 100%)`,
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.8rem",
                    boxShadow: `0 6px 20px rgba(255, 182, 193, 0.4)`,
                    transition: "all 0.3s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = `0 8px 25px rgba(255, 182, 193, 0.5)`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 6px 20px rgba(255, 182, 193, 0.4)`;
                  }}
                >
                  <Mic size={24} />
                  Record Right Now
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  style={{
                    padding: "1.5rem",
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "white",
                    background: `linear-gradient(135deg, #FF6B6B 0%, #C92A2A 100%)`,
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.8rem",
                    boxShadow: "0 6px 20px rgba(255, 107, 107, 0.4)",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                >
                  <StopCircle size={24} />
                  Stop Recording
                </button>
              )}
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#999",
                marginTop: "2rem",
                fontStyle: "italic",
              }}
            >
              Safe, private, and made just for singers like you ✨
            </p>
            <button
              onClick={() => setCurrentView("homepage")}
              style={{
                marginTop: "1.5rem",
                padding: "0.75rem 1.5rem",
                fontSize: "0.95rem",
                color: colors.skyBlue,
                background: "white",
                border: `2px solid ${colors.skyBlue}`,
                borderRadius: "15px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = colors.lightBlue;
                e.currentTarget.style.color = "white";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = colors.skyBlue;
              }}
            >
              ← Back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FORM SCREEN
  if (currentView === "form") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.paleRose} 50%, ${colors.lightBlue} 100%)`,
          padding: "2rem",
          fontFamily: '"Quicksand", sans-serif',
        }}
      >
        <style>{styles}</style>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <img
              src="/hazel-logo-transparent.png"
              alt="SongCoach"
              style={{ width: "200px", maxWidth: "60%", height: "auto" }}
            />
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "30px",
              padding: "2.5rem 2rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
              border: "3px solid rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(10px)",
            }}
          >
            <h2
              style={{
                fontSize: "1.8rem",
                color: "#333",
                marginBottom: "0.5rem",
                fontWeight: "600",
              }}
            >
              Tell me about your song! 🎵
            </h2>
            <p
              style={{ fontSize: "1rem", color: "#666", marginBottom: "2rem" }}
            >
              This helps me give you the best feedback
            </p>
            {audioFile && (
              <div
                style={{
                  padding: "1rem",
                  background: "#E8F5E9",
                  border: "2px solid #4CAF50",
                  borderRadius: "15px",
                  color: "#2E7D32",
                  marginBottom: "1.5rem",
                  fontSize: "0.95rem",
                }}
              >
                ✓ Audio file ready! Fill out the form below.
              </div>
            )}
            {error && (
              <div
                style={{
                  padding: "1rem",
                  background: "#FFF0F0",
                  border: "2px solid #FFB6C1",
                  borderRadius: "15px",
                  color: "#D8000C",
                  marginBottom: "1.5rem",
                  fontSize: "0.95rem",
                }}
              >
                {error}
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "0.5rem",
                  }}
                >
                  What's your first name? (optional)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Emma"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1.1rem",
                    border: "2px solid #E0E0E0",
                    borderRadius: "15px",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "0.5rem",
                  }}
                >
                  How old are you? *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  placeholder="e.g., 10"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1.1rem",
                    border: "2px solid #E0E0E0",
                    borderRadius: "15px",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "0.5rem",
                  }}
                >
                  What song are you singing? *
                </label>
                <input
                  type="text"
                  value={formData.songTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, songTitle: e.target.value })
                  }
                  placeholder="e.g., Defying Gravity"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1.1rem",
                    border: "2px solid #E0E0E0",
                    borderRadius: "15px",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "0.5rem",
                  }}
                >
                  From which musical? (optional)
                </label>
                <input
                  type="text"
                  value={formData.musical}
                  onChange={(e) =>
                    setFormData({ ...formData, musical: e.target.value })
                  }
                  placeholder="e.g., Wicked"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1.1rem",
                    border: "2px solid #E0E0E0",
                    borderRadius: "15px",
                    outline: "none",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#555",
                    marginBottom: "0.5rem",
                  }}
                >
                  What's your goal? *
                </label>
                <select
                  value={formData.goal}
                  onChange={(e) =>
                    setFormData({ ...formData, goal: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1.1rem",
                    border: "2px solid #E0E0E0",
                    borderRadius: "15px",
                    outline: "none",
                    fontFamily: "inherit",
                    backgroundColor: "white",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Choose one...</option>
                  <option value="practice">Just practicing</option>
                  <option value="audition">Preparing for an audition</option>
                  <option value="performance">Getting ready to perform</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                onClick={startOver}
                style={{
                  flex: 1,
                  padding: "1rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: "#666",
                  background: "white",
                  border: "2px solid #E0E0E0",
                  borderRadius: "15px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.borderColor = "#999")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.borderColor = "#E0E0E0")
                }
              >
                Back
              </button>
              <button
                onClick={analyzeSinging}
                disabled={isAnalyzing}
                style={{
                  flex: 2,
                  padding: "1rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: "white",
                  background: `linear-gradient(135deg, ${colors.skyBlue} 0%, ${colors.blushPink} 100%)`,
                  border: "none",
                  borderRadius: "15px",
                  cursor: isAnalyzing ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 20px rgba(135, 206, 235, 0.3)",
                  fontFamily: "inherit",
                  opacity: isAnalyzing ? 0.6 : 1,
                }}
              >
                {isAnalyzing ? "Analyzing..." : "Get My Feedback ✨"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ANALYZING SCREEN
  if (currentView === "analyzing") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.paleRose} 50%, ${colors.lightBlue} 100%)`,
          padding: "2rem",
          fontFamily: '"Quicksand", sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{styles}</style>
        <div
          style={{
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.95)",
            padding: "4rem 3rem",
            borderRadius: "30px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Loader
            size={60}
            stroke={colors.skyBlue}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <h2
            style={{
              fontSize: "2rem",
              color: "#333",
              marginTop: "2rem",
              marginBottom: "1rem",
              fontWeight: "600",
            }}
          >
            Listening to your singing... 🎵
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#666" }}>
            This will just take a moment!
          </p>
        </div>
      </div>
    );
  }

  // FEEDBACK SCREEN
  if (currentView === "feedback" && feedback) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.paleRose} 50%, ${colors.lightBlue} 100%)`,
          padding: "2rem",
          fontFamily: '"Quicksand", sans-serif',
        }}
      >
        <style>{styles}</style>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <img
              src="/hazel-logo-transparent.png"
              alt="SongCoach"
              style={{ width: "200px", maxWidth: "60%", height: "auto" }}
            />
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "30px",
              padding: "2.5rem 2rem",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08)",
              border: "3px solid rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(10px)",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "2rem",
                paddingBottom: "1.5rem",
                borderBottom: "2px solid rgba(135, 206, 235, 0.2)",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <Star fill={colors.blushPink} stroke="none" size={28} />
                <h2
                  style={{
                    fontSize: "2rem",
                    margin: "0",
                    color: "#333",
                    fontWeight: "600",
                  }}
                >
                  Your Feedback
                </h2>
                <Star fill={colors.skyBlue} stroke="none" size={28} />
              </div>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "#666",
                  margin: "0",
                  fontStyle: "italic",
                }}
              >
                {formData.name
                  ? `Great job singing "${formData.songTitle}" today, ${formData.name}! Here's what I noticed...`
                  : `Great job singing "${formData.songTitle}" today! Here's what I noticed...`}
              </p>
            </div>
       {feedback && feedback.raw && (
  <div style={{
    background: 'white',
    padding: '2rem',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6'
  }}>
    <div style={{ fontSize: '1.1rem', color: '#333' }}>
      {feedback.raw}
    </div>
  </div>
)}
          </div>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            <button
              onClick={startOver}
              style={{
                flex: 1,
                padding: "1.2rem",
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "white",
                background: `linear-gradient(135deg, ${colors.skyBlue} 0%, ${colors.blushPink} 100%)`,
                border: "none",
                borderRadius: "20px",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(135, 206, 235, 0.3)",
                fontFamily: "inherit",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 25px rgba(135, 206, 235, 0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(135, 206, 235, 0.3)";
              }}
            >
              Try Another Song 🎵
            </button>
          </div>
          <p
            style={{
              textAlign: "center",
              fontSize: "1rem",
              color: "#666",
              fontStyle: "italic",
            }}
          >
            Keep practicing - you're doing amazing! ✨
          </p>
        </div>
      </div>
    );
  }

  return null;
}
