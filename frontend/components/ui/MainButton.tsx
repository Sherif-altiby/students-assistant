import { Button } from './button'

const MainButton = ({title, icon}: {title: string, icon: React.ReactNode}) => {
    return (
        <Button className="h-11 gap-2 rounded-[var(--radius-md)] bg-primary px-5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
            {icon}
            {title}
        </Button>
    )
}

export default MainButton