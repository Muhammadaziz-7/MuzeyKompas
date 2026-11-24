import { useState } from "react";
import {
  MagnifyingGlass,
  Globe,
  VideoCamera,
  PlayCircle,
  FileText,
  ArrowSquareOut,
  BookOpen,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import resourcesData from "../data/resourcesData.json";
import Modal from "../components/ui/Modal.jsx";
import { fadeUpVariants, staggerContainerVariants } from "../motion.js";
import "./ResourcesPage.css";

function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeResource, setActiveResource] = useState(null);

  const categories = [
    "all",
    "Xalqaro muzeylar",
    "Milliy muzeylar",
    "Tarixiy joylar",
    "Muzey pedagogikasi",
    "Huquqiy asoslar",
  ];

  const filteredResources = resourcesData.filter((resource) => {
    const matchesCategory =
      selectedCategory === "all" || resource.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function getResourceIcon(type) {
    switch (type) {
      case "virtual-tour":
        return Globe;
      case "video":
        return VideoCamera;
      case "playlist":
        return PlayCircle;
      case "document":
        return FileText;
      default:
        return BookOpen;
    }
  }

  return (
    <section className="resources-page" aria-labelledby="resources-heading">
      <header className="resources-header">
        <div className="resources-header__content">
          <p className="resources-header__eyebrow">Muzey pedagogikasi</p>
          <h1 className="resources-header__title" id="resources-heading">
            Foydali manbalar va havolalar
          </h1>
          <p className="resources-header__description">
            Virtual muzey sayohatlari, video darslar, tarixiy joylar haqida
            ma'lumotlar va muzey faoliyatiga oid huquqiy hujjatlar to'plami.
          </p>
        </div>
        <div className="resources-header__decoration" aria-hidden="true">
          <BookOpen size={84} weight="light" />
        </div>
      </header>

      <div className="resources-controls">
        <div className="resources-search">
          <MagnifyingGlass size={18} weight="regular" aria-hidden="true" />
          <input
            type="search"
            placeholder="Manba qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="resources-search__input"
          />
        </div>

        <div className="resources-filters">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`resources-filter${
                selectedCategory === cat ? " resources-filter--active" : ""
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "all" ? "Barchasi" : cat}
            </button>
          ))}
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="resources-empty">
          <p>Hech qanday manba topilmadi.</p>
        </div>
      ) : (
        <motion.div
          className="resources-grid"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredResources.map((resource, index) => {
            const Icon = getResourceIcon(resource.type);
            return (
              <motion.article
                key={resource.id}
                className="resource-card"
                variants={fadeUpVariants}
              >
                <div className="resource-card__header">
                  <div className="resource-card__number">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <span className="resource-card__badge">{resource.badge}</span>
                </div>

                <div className="resource-card__icon-wrap">
                  <Icon size={48} weight="light" aria-hidden="true" />
                </div>

                <div className="resource-card__content">
                  <h3 className="resource-card__title">{resource.title}</h3>
                  <p className="resource-card__description">
                    {resource.description}
                  </p>
                  <div className="resource-card__meta">
                    <span className="resource-card__category">
                      {resource.category}
                    </span>
                  </div>
                </div>

                <div className="resource-card__actions">
                  {resource.type === "video" || resource.type === "playlist" ? (
                    <button
                      type="button"
                      className="resource-card__action resource-card__action--primary"
                      onClick={() => setActiveResource(resource)}
                    >
                      <PlayCircle size={18} weight="fill" aria-hidden="true" />
                      Videoni ko'rish
                    </button>
                  ) : (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resource-card__action resource-card__action--primary"
                    >
                      <ArrowSquareOut
                        size={18}
                        weight="regular"
                        aria-hidden="true"
                      />
                      Manbani ochish
                    </a>
                  )}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-card__action resource-card__action--secondary"
                  >
                    <ArrowSquareOut
                      size={16}
                      weight="regular"
                      aria-hidden="true"
                    />
                    Asl havola
                  </a>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      <Modal
        isOpen={activeResource !== null}
        onClose={() => setActiveResource(null)}
        title={activeResource?.title || ""}
        dialogClassName="modal-dialog--resource"
      >
        {activeResource &&
          (activeResource.type === "video" ||
            activeResource.type === "playlist") && (
            <div className="resource-player">
              <iframe
                src={activeResource.embedUrl}
                title={activeResource.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="resource-player__iframe"
              />
              <div className="resource-player__info">
                <p>{activeResource.description}</p>
                <div className="resource-player__meta">
                  <span className="resource-player__category">
                    {activeResource.category}
                  </span>
                  <a
                    href={activeResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-player__link"
                  >
                    <ArrowSquareOut
                      size={16}
                      weight="regular"
                      aria-hidden="true"
                    />
                    YouTube'da ochish
                  </a>
                </div>
              </div>
            </div>
          )}
      </Modal>
    </section>
  );
}

export default ResourcesPage;
