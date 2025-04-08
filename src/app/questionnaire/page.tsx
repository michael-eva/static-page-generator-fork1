import { getWebsiteCount } from "../server/websiteCount";
import WebsiteBuilderForm from "./components/Form";
import LimitReached from "./components/LimitReached";

export default async function QuestionnairePage() {
    const result = await getWebsiteCount()
    return (
        <div>
            {result.isLimitReached ? <LimitReached /> : <WebsiteBuilderForm />}
        </div>
    )
}
