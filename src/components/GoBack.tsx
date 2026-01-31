import { CurrentSelection } from "@/hooks/browsemStore"
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import "./GoBack.css";

export default function GoBack(props: { where: CurrentSelection, goBack: (somewhere: CurrentSelection) => void }) {
    const handleGoBack = () => {
        props.goBack(props.where);
    }
    return (
        <div className="back-icon-container" onClick={handleGoBack}>
            <ArrowBackIcon className="back-icon" />
        </div>
    )
}
