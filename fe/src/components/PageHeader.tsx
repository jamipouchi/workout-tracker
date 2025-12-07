import { Component } from "solid-js";

interface PageHeaderProps {
    action?: {
        href: string;
        label: string;
    };
}

const PageHeader: Component<PageHeaderProps> = (props) => {
    return (
        <div style={{ "display": "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "2rem" }}>
            <a href="/" style={{ "font-size": "0.9rem" }}>&larr; Back to Home</a>
            {props.action && (
                <a href={props.action.href} style={{ "font-size": "0.9rem", "font-weight": "bold", "color": "#0ea5e9" }}>
                    {props.action.label} &rarr;
                </a>
            )}
        </div>
    );
};

export default PageHeader;
