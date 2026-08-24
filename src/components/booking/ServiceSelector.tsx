"use client";

import React, { useState } from "react";
import { SERVICES_DATA, type ServiceItem } from "@/data/services";

interface ServiceSelectorProps {
  selectedService: ServiceItem;
  onSelectService: (service: ServiceItem) => void;
}

const imageMap: Record<string, string> = {
  "haircut-shave": "/services/haircut-shave.png",
  "haircut-massage": "/services/haircut-massage.png",
  "hair-dye": "/services/hair-dye.png",
  "global-hair-color": "/services/global-hair-color.png",
  "hair-spa": "/services/hair-spa.png",
  "hair-dye-de-tan": "/services/hair-dye-de-tan.png",
  "diamond-facial": "/services/diamond-facial.png",
  "premium-grooming": "/services/premium-grooming.png",
};

const getDuration = (service: ServiceItem) =>
  service.id === "haircut-massage"
    ? "45 mins"
    : service.id === "hair-dye-de-tan"
      ? "60 mins"
      : "30 mins";

export default function ServiceSelector({
  selectedService,
  onSelectService,
}: ServiceSelectorProps) {
  const [isChanging, setIsChanging] = useState(false);
  const [pendingService, setPendingService] = useState<ServiceItem>(selectedService);

  const openChangeService = () => {
    setPendingService(selectedService);
    setIsChanging(true);
  };

  const closeChangeService = () => {
    setPendingService(selectedService);
    setIsChanging(false);
  };

  const confirmService = () => {
    onSelectService(pendingService);
    setIsChanging(false);
  };

  return (
    <div className="vc-book-service-selector">
      {!isChanging ? (
        <>
          <div className="vc-book-section-head">
            <span>SELECTED SERVICE</span>
            <button type="button" onClick={openChangeService}>
              Change Service
            </button>
          </div>

          <div className="vc-selected-service-card">
            <div className="vc-selected-service-image-wrap">
              <img
                src={imageMap[selectedService.id]}
                alt=""
                className="vc-selected-service-image"
              />
            </div>
            <div className="vc-selected-service-info">
              <span className="vc-selected-number">{selectedService.number}</span>
              <h4>{selectedService.name}</h4>
              <p>{selectedService.includes.join(" · ")}</p>
              <div className="vc-duration">
                ◷ <span>{getDuration(selectedService)}</span>
              </div>
              <strong>
                {selectedService.currency}
                {selectedService.price}
              </strong>
            </div>
          </div>
        </>
      ) : (
        <div className="vc-change-service-panel">
          <div className="vc-change-service-titlebar">
            <button
              type="button"
              className="vc-change-back"
              aria-label="Back to selected service"
              onClick={closeChangeService}
            >
              ←
            </button>
            <span>CHANGE SERVICE</span>
            <button
              type="button"
              className="vc-change-close"
              aria-label="Close change service"
              onClick={closeChangeService}
            >
              ×
            </button>
          </div>

          <div className="vc-change-service-content">
            <div className="vc-service-list">
              {SERVICES_DATA.map((srv) => (
                <button
                  key={srv.id}
                  type="button"
                  className={srv.id === pendingService.id ? "active" : ""}
                  onClick={() => setPendingService(srv)}
                  aria-pressed={srv.id === pendingService.id}
                >
                  <span>{srv.number}</span>
                  <span className="vc-service-list-name">{srv.name}</span>
                  <span>
                    {srv.currency}
                    {srv.price}
                  </span>
                  {srv.id === pendingService.id && (
                    <span className="vc-check">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="vc-change-preview-wrap">
              <div className="vc-change-preview">
                <img src={imageMap[pendingService.id]} alt="" />
                <div>
                  <span>{pendingService.number}</span>
                  <h4>{pendingService.name}</h4>
                  <p>{pendingService.includes.join(" · ")}</p>
                  <div className="vc-change-duration">
                    ◷ <span>{getDuration(pendingService)}</span>
                  </div>
                  <strong>
                    {pendingService.currency}
                    {pendingService.price}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="vc-select-service-button"
                onClick={confirmService}
              >
                SELECT THIS SERVICE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
