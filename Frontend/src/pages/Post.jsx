import { useState } from "react";
import Navbar from "../components/Navbar";
import { apiInstance } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

export default function Post() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("FOUND");
  const [category, setCategory] = useState("Electronics");
  const [files, setFiles] = useState([]);
  const [btn, setBtn] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const submitData = async (e) => {
    e.preventDefault();

    if (!title.trim() || !desc.trim() || !category || !type) {
      enqueueSnackbar("Please fill in all required fields", { variant: "warning" });
      return;
    }

    setBtn(false);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", desc);
    formData.append("type", type);
    formData.append("category", category);
    formData.append("status", type); // Initial status matches the report type

    // Append multiple files
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
    }

    try {
      await apiInstance.post("/items", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      enqueueSnackbar("Item Posted Successfully", { variant: "success" });
      navigate("/find");
    } catch (err) {
      console.error(err);
      enqueueSnackbar(err.response?.data?.message || "Failed to post item", { variant: "error" });
      setBtn(true);
    }
  };

  return (
    <main id="postItem">
      <Navbar />
      <section className="post-section">
        <h1 className="lfh1">Report Lost / Found Item</h1>
        <div className="form-container">
          <h2>Please describe the item and location details</h2>
          <form className="form" onSubmit={submitData} encType="multipart/form-data">
            <div className="input-container">
              <label>Report Type *</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="FOUND">I Found an Item</option>
                <option value="LOST">I Lost an Item</option>
              </select>
            </div>

            <div className="input-container">
              <label>Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Electronics">Electronics</option>
                <option value="Wallets">Wallets & Purses</option>
                <option value="Keys">Keys</option>
                <option value="Documents">Documents & Cards</option>
                <option value="Clothes">Clothing & Gear</option>
                <option value="Pets">Pets & Animals</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="input-container">
              <label>Title *</label>
              <input
                type="text"
                placeholder="e.g. Black leather wallet, iPhone 13"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="input-container">
              <label>Detailed Description *</label>
              <textarea
                placeholder="Describe specific markings, color, brand, and where it was lost/found..."
                onChange={(e) => setDesc(e.target.value)}
                value={desc}
                required
              ></textarea>
            </div>

            <div className="input-container">
              <label>Upload Images (Multiple supported)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                name="files"
                multiple
              />
              <span className="file-hint">Select one or more images to help identify the item.</span>
            </div>

            <div className="input-container">
              {btn ? (
                <button type="submit" className="submitbtn">
                  Submit Report
                </button>
              ) : (
                <button className="submitbtn" disabled>
                  Submitting Report...
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
