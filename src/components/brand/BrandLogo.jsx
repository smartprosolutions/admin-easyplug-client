import React from "react";
import Box from "@mui/material/Box";
import { useUserProfileQuery } from "../../services/queries";
import {
  applyDocumentBrandIcons,
  DEFAULT_BRAND_LOGO,
  pickBrandLogoUrl,
} from "../../utils/brandLogo";

export default function BrandLogo({
  alt = "EasyPlug Logo",
  sx,
  updateDocumentIcons = false,
  ...otherProps
}) {
  const { data: profileData } = useUserProfileQuery({ retry: false });
  const apiLogo = pickBrandLogoUrl(profileData);
  const src = apiLogo || DEFAULT_BRAND_LOGO;

  React.useEffect(() => {
    if (!updateDocumentIcons) return;
    applyDocumentBrandIcons(src);
  }, [src, updateDocumentIcons]);

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={(event) => {
        if (event.currentTarget.src !== DEFAULT_BRAND_LOGO) {
          event.currentTarget.src = DEFAULT_BRAND_LOGO;
        }
      }}
      sx={{
        objectFit: "contain",
        display: "block",
        ...sx,
      }}
      {...otherProps}
    />
  );
}
