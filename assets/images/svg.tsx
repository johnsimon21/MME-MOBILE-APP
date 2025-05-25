import Svg, { G, Path, Defs, ClipPath, Rect } from 'react-native-svg';

interface SessionIconProps {
    color?: string;
    size?: number;
}

const SessionIcon = ({ color = "#222222", size = 18 }: SessionIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <G clipPath="url(#clip0_159_1742)">
            <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.33333 0.75V2.58333H2.58333V15.4167H5.33333V17.25H0.75V0.75H5.33333ZM17.25 0.75V17.25H12.6667V15.4167H15.4167V2.58333H12.6667V0.75H17.25ZM13.5833 11.75V13.5833H4.41667V11.75H13.5833ZM13.5833 8.08333V9.91667H4.41667V8.08333H13.5833ZM13.5833 4.41667V6.25H4.41667V4.41667H13.5833Z"
                fill={color}
            />
        </G>
        <Defs>
            <ClipPath id="clip0_159_1742">
                <Rect width="18" height="18" fill="white" />
            </ClipPath>
        </Defs>
    </Svg>
);

interface UnfoldVerticalIconProps {
    color?: string;
    size?: number;
}

const UnfoldVerticalIcon = ({ color = "#222222", size = 18 }: UnfoldVerticalIconProps) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <G clipPath="url(#clip0_31_210)">
            <Path 
                d="M10 18.3333V13.3333" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            <Path 
                d="M10 6.66669V1.66669" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            <Path 
                d="M3.33329 10H1.66663" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            <Path 
                d="M8.33329 10H6.66663" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            <Path 
                d="M13.3333 10H11.6666" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            <Path 
                d="M18.3333 10H16.6666" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            <Path 
                d="M12.5 15.8333L10 18.3333L7.5 15.8333" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            <Path 
                d="M12.5 4.16669L10 1.66669L7.5 4.16669" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
        </G>
        <Defs>
            <ClipPath id="clip0_31_210">
                <Rect width="20" height="20" fill="white" />
            </ClipPath>
        </Defs>
    </Svg>
);

export { SessionIcon, UnfoldVerticalIcon };
