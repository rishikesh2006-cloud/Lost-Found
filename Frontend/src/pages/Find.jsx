import React, { useState, useEffect } from "react";
import Itemcard from "../components/ItemCard";
import Navbar from "../components/Navbar";
import axios from "axios";
import { apiBaseUrl } from "../context/AuthContext";
import HashLoader from "react-spinners/HashLoader";
import AOS from "aos";
import "aos/dist/aos.css";

function Find() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    AOS.init({ duration: 750 });
  }, []);

  // Fetch items based on active filters
  const fetchItems = () => {
    setLoading(true);
    axios
      .get(`${apiBaseUrl}/items`, {
        params: {
          query: searchQuery,
          type: selectedType,
          category: selectedCategory,
          status: selectedStatus,
        },
      })
      .then((res) => {
        setItems(res.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  };

  // Re-fetch when any filter changes
  useEffect(() => {
    fetchItems();
  }, [searchQuery, selectedType, selectedCategory, selectedStatus]);

  const override = {
    display: "block",
    borderColor: "#fdf004",
    position: "absolute",
    top: "60%",
    left: "50%",
    transform: "translate(-50%,-50%)",
  };

  return (
    <main id="findpage">
      <Navbar />
      <section className="find-section">
        <h1 className="lfh1">Lost and Found Repository</h1>
        
        {/* Modern Filter panel */}
        <div className="filter-panel">
          <div className="filter-group search">
            <input
              type="text"
              placeholder="Search by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="">All Types</option>
              <option value="LOST">Lost Reports</option>
              <option value="FOUND">Found Reports</option>
            </select>
          </div>

          <div className="filter-group">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Wallets">Wallets & Purses</option>
              <option value="Keys">Keys</option>
              <option value="Documents">Documents & Cards</option>
              <option value="Clothes">Clothing & Gear</option>
              <option value="Pets">Pets & Animals</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="filter-group">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="LOST">Lost</option>
              <option value="FOUND">Found</option>
              <option value="CLAIMED">Claimed</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>
        </div>

        {/* Item listing grid */}
        <div className="item-container-wrapper">
          {loading ? (
            <div style={{ minHeight: "200px", position: "relative", width: "100%" }}>
              <HashLoader
                color="#fdf004"
                loading={loading}
                cssOverride={override}
                size={50}
                aria-label="Loading Spinner"
              />
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <h3>No Matching Items Found</h3>
              <p>Try refining your search terms or adjusting the filter categories.</p>
            </div>
          ) : (
            <div className="item-container">
              {items.map((findItem) => {
                // Pass the first image in the array if available
                const firstImg = findItem.images && findItem.images.length > 0 ? findItem.images[0] : null;
                return (
                  <Itemcard
                    key={findItem.id}
                    id={findItem.id}
                    title={findItem.title}
                    description={findItem.description}
                    image={firstImg}
                  />
                );
              })}
              
              <div className="extraItem"></div>
              <div className="extraItem"></div>
              <div className="extraItem"></div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Find;
