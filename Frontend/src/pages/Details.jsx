import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import CallIcon from "@mui/icons-material/Call";
import EmailIcon from "@mui/icons-material/Email";
import ChatIcon from "@mui/icons-material/Chat";
import GavelIcon from "@mui/icons-material/Gavel";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../config";
import { apiInstance, useAuth } from "../context/AuthContext";
import HashLoader from "react-spinners/HashLoader";
import noimg from "../assets/no-image.png";
import { useSnackbar } from "notistack";

function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Claim Form State
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimDescription, setClaimDescription] = useState("");
  const [claiming, setClaiming] = useState(false);

  const override = {
    display: "block",
    borderColor: "#fdf004",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
  };

  useEffect(() => {
    fetchItemDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchItemDetails = () => {
    setLoading(true);
    // Use apiInstance to send authenticated requests, revealing contact info if owner/admin
    apiInstance
      .get(`/items/${id}`)
      .then((res) => {
        setItem(res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        enqueueSnackbar("Error loading item details", { variant: "error" });
        setLoading(false);
      });
  };

  const handleStartChat = () => {
    if (!user) {
      enqueueSnackbar("Please login to contact the reporter", { variant: "warning" });
      navigate("/login");
      return;
    }
    // Redirect to Chat page, passing partner and item details as state
    navigate("/chat", {
      state: {
        partner: { id: item.founderId, username: item.founderName },
        item: { id: item.id, title: item.title },
      },
    });
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      enqueueSnackbar("Please login to claim this item", { variant: "warning" });
      navigate("/login");
      return;
    }
    if (!claimDescription.trim()) {
      enqueueSnackbar("Please describe your proof of ownership", { variant: "warning" });
      return;
    }

    setClaiming(true);
    try {
      await apiInstance.post("/claims", {
        itemId: item.id,
        description: claimDescription,
      });
      enqueueSnackbar("Claim request submitted successfully!", { variant: "success" });
      setShowClaimForm(false);
      setClaimDescription("");
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || "Failed to submit claim", { variant: "error" });
    } finally {
      setClaiming(false);
    }
  };

  // Image helpers
  const imagesList = item?.images || [];
  const activeImage = imagesList.length > 0 ? `${api}/files/${imagesList[currentImageIndex]}` : noimg;

  return (
    <main id="detailspage">
      <Navbar />
      <section className="details-section">
        {loading ? (
          <HashLoader
            color="#fdf004"
            loading={loading}
            cssOverride={override}
            size={50}
            aria-label="Loading Spinner"
          />
        ) : !item ? (
          <div className="error-card">
            <h2>Item Not Found</h2>
            <p>The reported item does not exist or has been removed.</p>
          </div>
        ) : (
          <div className="details-card">
            {/* Multi-image slideshow */}
            <div className="img-container-slideshow">
              <img src={activeImage} alt={item.title} onError={(e) => { e.target.src = noimg; }} />
              {imagesList.length > 1 && (
                <div className="slideshow-controls">
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1))}
                  >
                    ◀
                  </button>
                  <span>
                    {currentImageIndex + 1} / {imagesList.length}
                  </span>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1))}
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>

            {/* Premium Action Row */}
            <div className="action-container">
              {/* If owner or admin, show secure contact buttons */}
              {item.email || item.phoneno ? (
                <>
                  {item.phoneno && (
                    <a href={`tel:${item.phoneno}`} className="contact-btn phone">
                      <CallIcon /> Call ({item.phoneno})
                    </a>
                  )}
                  {item.email && (
                    <a href={`mailto:${item.email}`} className="contact-btn email">
                      <EmailIcon /> Email ({item.email})
                    </a>
                  )}
                </>
              ) : null}

              {/* internal chat button (always shown to other logged-in users) */}
              {user?.id !== item.founderId && (
                <button onClick={handleStartChat} className="contact-btn chat">
                  <ChatIcon /> Secure Chat
                </button>
              )}

              {/* claim button (only for found items, shown to other users) */}
              {item.type === "FOUND" && user?.id !== item.founderId && item.status !== "CLAIMED" && (
                <button onClick={() => setShowClaimForm(true)} className="contact-btn claim">
                  <GavelIcon /> Request Claim
                </button>
              )}
            </div>

            {/* Displaying Item Details */}
            <div className="details-text-area">
              <span className={`type-tag ${item.type}`}>{item.type}</span>
              <span className={`status-tag ${item.status}`}>{item.status.toLowerCase()}</span>
              <h1>{item.title}</h1>
              
              <div className="details-container">
                <p>Category</p>
                <p><strong>{item.category}</strong></p>
              </div>

              <div className="details-container">
                <p>Reporter</p>
                <p><strong>{item.founderName}</strong></p>
              </div>

              <div className="details-container desc">
                <p>Description</p>
                <p>{item.description}</p>
              </div>

              <div className="details-container">
                <p>Reported On</p>
                <p>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>

            {/* Claim Submission Popup Drawer */}
            {showClaimForm && (
              <div className="claim-modal-overlay">
                <div className="claim-modal">
                  <h3>Submit Claim Request</h3>
                  <p>Provide description, serial numbers, or other proof to verify ownership of this item.</p>
                  
                  <form onSubmit={handleClaimSubmit}>
                    <textarea
                      placeholder="Specify proof of ownership (e.g. wallpaper description for phone, contents of wallet, purchase date...)"
                      value={claimDescription}
                      onChange={(e) => setClaimDescription(e.target.value)}
                      required
                    ></textarea>
                    
                    <div className="modal-buttons">
                      <button type="submit" className="modal-submit-btn" disabled={claiming}>
                        {claiming ? "Submitting..." : "Submit Proof"}
                      </button>
                      <button type="button" className="modal-cancel-btn" onClick={() => setShowClaimForm(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default Details;
