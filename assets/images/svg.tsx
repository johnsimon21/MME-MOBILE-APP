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

export { SessionIcon };
