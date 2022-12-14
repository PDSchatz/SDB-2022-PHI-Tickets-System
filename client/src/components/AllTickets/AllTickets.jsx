import React, { useEffect, useState, useContext } from 'react'
import { Route, Routes, NavLink, Navigate, useLocation } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css'
import { Container, Row, Col, Label, Input } from "reactstrap"
import { LoginContext } from '../../index'
import "./AllTickets.css"
import TicketsTable from './TicketsTable'
import OneTicket from '../OneTicket/OneTicket';


function AllTickets(props) {

    const { sessionRole, sessionToken, sessionId } = useContext(LoginContext);
    const [role, setRole] = useState(parseInt(sessionRole));

    const [ticketId, setTicketId] = useState("");

    const [allStatus, setAllStatus] = useState(true)
    const [completedStatus, setCompletedStatus] = useState(false)

    useEffect(() => {

        setRole(parseInt(sessionRole));

    }, []);

    const [filters, setFilters] = useState(['All'])

    const onChange = (e) => {
        if (e.target.checked === true && e.target.value !== "All") {
            setAllStatus(false)
            const filterIndex = filters.indexOf("All")
            filters.splice(filterIndex, 1)
            setFilters([...filters, filters])
        } else if (e.target.value === "All") {
            setAllStatus(true)
            setCompletedStatus(false)
        }
        const isChecked = e.target.checked
        if (isChecked) {
            setFilters([...filters, e.target.value])
        } else {
            const filterIndex = filters.indexOf(e.target.value)
            filters.splice(filterIndex, 1)
            setFilters([...filters, filters])
        }
    }

    return (
        <>
            <Routes>
                <Route
                    path="/oneticket"
                    element={
                        <OneTicket ticketId={ticketId} sessionId={sessionId} />} />
            </Routes>

            <Container className="ticket-container">
                <Row>
                    <Col>
                        <Label>
                            <Input
                                name="all"
                                value="All"
                                checked={allStatus}
                                onChange={onChange}
                                type="checkbox"
                            />
                            All Tickets <em>(Excluding Completed)</em>
                        </Label>
                        <Label>
                            <Input
                                name="completed"
                                value="Completed"
                                checked={completedStatus}
                                onChange={(e) => { { onChange(e) }; setCompletedStatus(!completedStatus) }}
                                type="checkbox"
                            />
                            Completed
                        </Label>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Label>
                            <Input
                                name="new-request"
                                value="New Request"
                                onChange={onChange}
                                type="checkbox"
                            />
                            New Request
                        </Label>
                        <Label>
                            <Input
                                name="triage"
                                value="Triage"
                                onChange={onChange}
                                type="checkbox"
                            />
                            Triage
                        </Label>
                        <Label>
                            <Input
                                name="in-progress"
                                value="In Progress"
                                onChange={onChange}
                                type="checkbox"
                            />
                            In Progress
                        </Label>
                        <Label>
                            <Input
                                name="on-hold"
                                value="On-Hold (Vendor)"
                                onChange={onChange}
                                type="checkbox"
                            />
                            On-Hold (Vendor)
                        </Label>
                        <Label>
                            <Input
                                name="director-review'"
                                value="Review (Director)"
                                onChange={onChange}
                                type="checkbox"
                            />
                            Review (Director)
                        </Label>
                        <Label>
                            <Input
                                name="requestor-review'"
                                value="Review (Requestor)"
                                onChange={onChange}
                                type="checkbox"
                            />
                            Review (Requestor)
                        </Label>
                    </Col>
                </Row>
                <Row className="tickets-table-row">
                    <Col>
                        <TicketsTable filters={filters} setTicketId={setTicketId} />
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default AllTickets