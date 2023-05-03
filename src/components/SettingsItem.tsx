import * as React from "react";

export default function SettingsItem({
	name,
	description,
	children,
}: {
	name?: string;
	description?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="setting-item">
			{(name || description) && (
				<div className="setting-item-info">
					{name && <div className="setting-item-name">{name}</div>}
					{description && (
						<div className="setting-item-description">
							{description}
						</div>
					)}
				</div>
			)}
			{children && <div className="setting-item-control">{children}</div>}
		</div>
	);
}
